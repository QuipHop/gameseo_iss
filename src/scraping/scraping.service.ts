import { BadRequestException, Injectable } from '@nestjs/common';
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

  // Helper function to validate and format the URL
  validateAndFormatUrl(url: string): string {
    // Regex to match the base Google Play URL format
    const playStoreRegex =
      /^https:\/\/play\.google\.com\/store\/apps\/details\?id=([a-zA-Z0-9._-]+)(?:&.*)?$/;

    // Check if the URL matches the expected format
    const match = url.match(playStoreRegex);
    if (!match) {
      throw new BadRequestException(
        'Invalid URL. It must start with "https://play.google.com/store/apps/details?id=" followed by a valid app ID.',
      );
    }

    // Extract the base URL
    const baseUrl = match[0]; // Full matched URL

    // Ensure `hl=en` parameter is present
    const formattedUrl = baseUrl.includes('&hl=')
      ? baseUrl // Keep as is if `hl` is already present
      : `${baseUrl}&hl=en`;

    console.log('Validated and formatted URL:', formattedUrl);
    return formattedUrl;
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

  async scrapeAndSaveGameData(url: string): Promise<Game> {
    // Validate and format the URL
    const formattedUrl = this.validateAndFormatUrl(url);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      // Navigate to the URL
      await page.goto(formattedUrl, { waitUntil: 'domcontentloaded' });

      // Verify the loaded URL
      const currentUrl = await page.url();
      console.log('Navigated to URL:', currentUrl);

      if (currentUrl !== formattedUrl) {
        throw new Error(
          `Navigation error. Expected: ${formattedUrl}, but got: ${currentUrl}`,
        );
      }

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

        const getIconUrl = () => {
          // Select the meta tag with property="og:image"
          const metaIconElement = document.querySelector(
            'meta[property="og:image"]',
          );

          // If the meta tag is found, return its "content" attribute
          if (metaIconElement) {
            return metaIconElement.getAttribute('content');
          }

          // If not found, return null
          return null;
        };

        const getRating = () => {
          const starRatingElement = document.querySelector(
            '[itemprop="starRating"]',
          );
          return starRatingElement?.textContent?.match(/[\d.]+/)?.[0] || null;
        };

        return {
          title: getItemProp('name'),
          description: getDescription(),
          genres: getAllItemProps('genre'),
          iconUrl: getIconUrl(),
          rating: getRating(),
        };
      });

      console.log('Extracted game data:', gameData);

      const parsedData = {
        title: gameData.title || 'N/A',
        description: gameData.description || 'N/A',
        genres: gameData.genres || [],
        iconUrl: gameData.iconUrl || null,
        rating: parseFloat(gameData.rating) || null,
      };

      if (!parsedData.iconUrl) {
        console.warn('Icon URL is missing or invalid');
      }

      // Check if the game already exists by title or URL
      let game = await this.gameRepository.findOne({
        where: [{ title: parsedData.title }, { url: formattedUrl }],
        relations: ['terms'], // Load terms to remove existing links
      });

      if (game) {
        // Update the existing game
        game.description = parsedData.description;
        game.genre = parsedData.genres;
        game.iconUrl = parsedData.iconUrl; // Update iconUrl
        game.rating = parsedData.rating; // Save rating
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
          url: formattedUrl,
          genre: parsedData.genres,
          iconUrl: parsedData.iconUrl, // Save iconUrl
          rating: parsedData.rating, // Save rating
        });
        game = await this.gameRepository.save(game);
      }

      // Tokenize and save terms (title + description + genres) with stop word filtering
      const tokens = [
        ...advancedTokenizeContent(parsedData.title),
        ...advancedTokenizeContent(parsedData.description),
        ...parsedData.genres.map((genre) => genre.toLowerCase()), // Ensure genres are included
      ];

      for (const token of tokens) {
        let term = await this.termRepository.findOne({
          where: { term: token },
        });

        if (!term) {
          term = this.termRepository.create({ term: token });
          term = await this.termRepository.save(term);
        }

        // Link the term to the game
        const isAlreadyLinked = await this.gameRepository
          .createQueryBuilder()
          .relation(Game, 'terms')
          .of(game)
          .loadMany();

        if (!isAlreadyLinked.find((linkedTerm) => linkedTerm.id === term.id)) {
          await this.gameRepository
            .createQueryBuilder()
            .relation(Game, 'terms')
            .of(game)
            .add(term);
        }
      }

      return game;
    } finally {
      await browser.close();
    }
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

  async getTopKeywordsByGenre(): Promise<
    { genre: string; keywords: { term: string; count: number }[] }[]
  > {
    // Query to fetch top keywords grouped by genre
    const query = `
      SELECT
        g.genre AS genre,
        t.term AS term,
        COUNT(*) AS count
      FROM game_terms_term gtt
      JOIN term t ON t.id = gtt.termId
      JOIN game g ON g.id = gtt.gameId
      WHERE g.genre IS NOT NULL
      GROUP BY g.genre, t.term
      ORDER BY g.genre, count DESC
    `;

    const results = await this.gameRepository.query(query);

    // Transform the results into grouped data
    const groupedResults = results.reduce((acc, row) => {
      const genre = row.genre;
      if (!acc[genre]) {
        acc[genre] = [];
      }
      acc[genre].push({ term: row.term, count: parseInt(row.count, 10) });
      return acc;
    }, {});

    // Limit to top 10 genres and top keywords per genre
    return Object.entries(groupedResults)
      .slice(0, 10) // Top 10 genres
      .map(([genre, keywords]) => ({
        genre,
        keywords: (keywords as any[]).slice(0, 10), // Top 10 keywords per genre
      }));
  }

  // Method to retrieve all games
  async getAllGames(): Promise<Game[]> {
    return this.gameRepository.find();
  }
}
