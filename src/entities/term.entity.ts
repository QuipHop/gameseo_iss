import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class Term {
  @PrimaryGeneratedColumn()
  id: number; // Add this property if it's missing

  @Column({ unique: true })
  term: string;

  @ManyToMany(() => Game, (game) => game.terms)
  games: Game[];
}
