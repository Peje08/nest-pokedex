import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreatePokemonDto } from "./dto/create-pokemon.dto";
import { UpdatePokemonDto } from "./dto/update-pokemon.dto";
import { isValidObjectId, Model } from "mongoose";
import { Pokemon } from "./entities/pokemon.entity";
import { InjectModel } from "@nestjs/mongoose";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);

      return pokemon;
    } catch (err) {
      this.handleExceptions(err);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit, offset} = paginationDto;

    return this.pokemonModel.find()
      .limit( limit )
      .skip( offset )
      .sort({
        no: 1
      })
      .select('-__v');
  }

  async findOne(term: string) {
    let pokemon: Pokemon;

    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }
    if ( !pokemon ) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() })
    }

    if (!pokemon)
      throw new NotFoundException(
        `Pokemon whit id, name or no '${term}' not found`,
      );

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.pokemonModel.findById(term);
    if (updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
    try {
      await pokemon.updateOne(updatePokemonDto, { new: true });

      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (err) {
      this.handleExceptions(err);
    }
  }

  async remove(id: string) {
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id})
    if(deletedCount === 0) 
      throw new BadRequestException(`Pokemon whit ${id} not found`)
    return
  }

  private handleExceptions(err: any) {
    if (err.code === 11000) {
      throw new BadRequestException(
        `This Pokemon already exists: ${JSON.stringify(err.keyValue)}`,
      );
    }
    console.log(err);
    throw new InternalServerErrorException(`Can't create Pokemon`);
  }
}
