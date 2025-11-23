import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoriaDocument = Categoria & Document;

@Schema({ timestamps: true })
export class Categoria {
  @Prop({ unique: true })
  nombre: string;

  @Prop()
  descripcion?: string;

  @Prop()
  imagen?: string;

  @Prop()
  imagenThumbnail?: string;

  @Prop({ default: true })
  activa?: boolean;

}

export const CategoriaSchema = SchemaFactory.createForClass(Categoria);

CategoriaSchema.index({ nombre: 1 });
