import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Term } from './term.entity';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  genre: string[];

  @Column({ type: 'date', nullable: true })
  releaseDate: Date;

  @ManyToMany(() => Term, (term) => term.games, { cascade: true })
  @JoinTable()
  terms: Term[];
}
