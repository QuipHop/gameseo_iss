import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class Term {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  term: string;

  @ManyToMany(() => Game, (game) => game.terms)
  games: Game[];
}
