import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Term } from './term.entity';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'float', nullable: true, default: 0 })
  rating: number;

  @Column({ nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  genre: string[];

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  iconUrl: string;

  @ManyToMany(() => Term, (term) => term.games, { cascade: true })
  @JoinTable() // This defines the join table for the ManyToMany relationship
  terms: Term[];
}
