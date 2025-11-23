import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductoDocument = Producto & Document;

@Schema({ timestamps: true })
export class Producto {
  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true })
  descripcion: string;

  @Prop({ min: 0 })
  precio: number;

  @Prop({ default: 0, min: 0 })
  stock?: number;

  @Prop({ type: Types.ObjectId, ref: 'Categoria', required: true })
  categoria: Types.ObjectId;

  @Prop()
  imagen?: string;

  @Prop()
  imagenThumbnail?: string;

  @Prop({ default: true })
  activo?: boolean;

  @Prop({ enum: ['kg', 'unidad', 'litro'], default: 'unidad' })
  unidad?: string;

}

export const ProductoSchema = SchemaFactory.createForClass(Producto);

ProductoSchema.index({ categoria: 1 });
ProductoSchema.index({ activo: 1 });
ProductoSchema.index({ nombre: 'text', descripcion: 'text' });
