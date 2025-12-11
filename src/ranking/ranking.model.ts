import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
@Table({
  tableName: 'rankings',
  timestamps: true,
})
export class Ranking extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'domain',
  })
  declare domain: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'rank',
  })
  declare rank: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'date',
  })
  declare date: string;
}
