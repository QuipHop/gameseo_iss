import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from 'src/entities/game.entity';
import { Term } from 'src/entities/term.entity';
import { advancedTokenizeContent } from 'src/utils/tokenizer.util';

@Injectable()
export class ScrapingService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,

    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
  ) {}

  async scrapeAndSaveGameData(url: string): Promise<Game> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // Scrape game data
      const gameData = await page.evaluate(() => {
        const getItemProp = (selector) =>
          document
            .querySelector(`[itemprop="${selector}"]`)
            ?.textContent?.trim() || null;

        const getAllItemProps = (selector) => {
          return Array.from(
            document.querySelectorAll(`[itemprop="${selector}"]`),
          )
            .map((el) => el.textContent?.trim())
            .filter(Boolean); // Remove empty or null values
        };

        const getDescription = () => {
          return (
            document
              .querySelector('[data-g-id="description"]')
              ?.textContent?.trim() || 'No description available'
          );
        };

        return {
          title: getItemProp('name'),
          description: getDescription(),
          genres: getAllItemProps('genre'),
        };
      });

      const parsedData = {
        title: gameData.title || 'N/A',
        description: gameData.description || 'N/A',
        genres: gameData.genres || [],
      };

      // Check if the game already exists
      let game = await this.gameRepository.findOne({
        where: { title: parsedData.title },
        relations: ['terms'], // Load terms to remove existing links
      });

      if (game) {
        // Update existing game
        game.description = parsedData.description;
        game.genre = parsedData.genres;
        game = await this.gameRepository.save(game);

        // Explicitly remove all term links
        await this.gameRepository
          .createQueryBuilder()
          .relation(Game, 'terms')
          .of(game)
          .remove(game.terms); // Fully remove existing links
      } else {
        // Create a new game if it doesn't exist
        game = this.gameRepository.create({
          title: parsedData.title,
          description: parsedData.description,
          genre: parsedData.genres,
        });
        game = await this.gameRepository.save(game);
      }

      // Tokenize and save terms (title + description + genres) with stop word filtering
      const tokens = [
        ...advancedTokenizeContent(parsedData.title),
        ...advancedTokenizeContent(parsedData.description),
        ...parsedData.genres, // Add genres directly as terms
      ];

      console.log('Tokens to save:', tokens); // Log the tokens

      // Save terms and link to the game
      for (const token of tokens) {
        let term = await this.termRepository.findOne({
          where: { term: token },
        });

        if (!term) {
          // Insert new term
          term = this.termRepository.create({ term: token });
          term = await this.termRepository.save(term);
          console.log(`Inserted term: ${token}`); // Log inserted terms
        }

        // Check if the term is already linked to the game
        const isAlreadyLinked = await this.gameRepository
          .createQueryBuilder()
          .relation(Game, 'terms')
          .of(game)
          .loadMany();

        if (!isAlreadyLinked.find((linkedTerm) => linkedTerm.id === term.id)) {
          // Add the term if not already linked
          await this.gameRepository
            .createQueryBuilder()
            .relation(Game, 'terms')
            .of(game)
            .add(term);
          console.log(`Linked term: ${token} to game: ${game.title}`); // Log linked terms
        }
      }

      return game;
    } finally {
      await browser.close();
    }
  }

  // Search function
  async searchGames(query: string): Promise<Game[]> {
    // Tokenize the query
    const tokens = advancedTokenizeContent(query);

    // Find all terms matching the query tokens
    const terms = await this.termRepository.find({
      where: tokens.map((token) => ({ term: token })),
    });

    // Get the termIds from the found terms
    const termIds = terms.map((term) => term.id);

    if (termIds.length === 0) {
      return []; // No matching terms found
    }

    // Retrieve games linked to these terms
    const games = await this.gameRepository
      .createQueryBuilder('game')
      .innerJoin('game.terms', 'term')
      .where('term.id IN (:...termIds)', { termIds })
      .groupBy('game.id')
      .orderBy('COUNT(term.id)', 'DESC') // Order by the number of matches
      .getMany();

    return games;
  }

  // In ScrapingService or a separate statistics service
  async getTopKeywords(): Promise<{ keyword: string; count: number }[]> {
    // Fetch the top 500 keywords and their counts
    const query = `
    SELECT term, COUNT(*) as count 
    FROM game_terms_term
    JOIN term ON term.id = game_terms_term.termId
    GROUP BY term
    ORDER BY count DESC
    LIMIT 500;
  `;
    return this.gameRepository.query(query); // Adjust for your ORM or raw query method
  }

  // Method to retrieve all games
  async getAllGames(): Promise<Game[]> {
    return this.gameRepository.find();
  }
}
