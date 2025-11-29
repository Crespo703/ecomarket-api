import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { Pedido, PedidoDocument } from './schemas/pedido.schema';
import { ClienteProfileService } from '../cliente-profile/cliente-profile.service';
import { ProductoService } from '../producto/producto.service';

@Injectable()
export class PedidoService {
  constructor(
    @InjectModel(Pedido.name) private pedidoModel: Model<PedidoDocument>,
    private clienteProfileService: ClienteProfileService,
    private productoService: ProductoService,
  ) {}

  async create(createPedidoDto: CreatePedidoDto, userId: string): Promise<Pedido> {
    let clienteId: string;

    // 1. Determinar el cliente
    if (createPedidoDto.cliente) {
      // Si se especificó un cliente (caso ADMIN), usarlo directamente
      clienteId = createPedidoDto.cliente;
    } else {
      // Si no, buscar el ClienteProfile del usuario autenticado
      const clienteProfile = await this.clienteProfileService.findByUserId(userId);
      clienteId = (clienteProfile as any)._id.toString();
    }

    // 2. Buscar cada producto y calcular precio
    const itemsConPrecio = await Promise.all(
      createPedidoDto.items.map(async (item) => {
        const producto = await this.productoService.findOne(item.producto);
        return {
          producto: new Types.ObjectId(item.producto),
          cantidad: item.cantidad,
          precio: producto.precio, // Usar el precio actual del producto
        };
      })
    );

    // 3. Calcular total
    const total = itemsConPrecio.reduce(
      (sum, item) => sum + item.precio * item.cantidad,
      0
    );

    // 4. Crear el pedido
    const nuevoPedido = await this.pedidoModel.create({
      cliente: new Types.ObjectId(clienteId),
      items: itemsConPrecio,
      total,
      direccionEntrega: createPedidoDto.direccionEntrega,
      notasEntrega: createPedidoDto.notasEntrega,
    });

    return nuevoPedido;
  }

  async findAll(): Promise<Pedido[]> {
    const pedidos = await this.pedidoModel.find().populate('cliente', 'nombre email telefono');
    return pedidos;
  }

  async findOne(id: string | number): Promise<Pedido> {
    const pedido = await this.pedidoModel.findById(id).populate('cliente', 'nombre email telefono');
    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }
    return pedido;
  }

  async update(id: string | number, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.pedidoModel.findByIdAndUpdate(id, updatePedidoDto, { new: true }).populate('cliente', 'nombre email telefono')
    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }
    return pedido;
  }

  async remove(id: string | number): Promise<void> {
    const result = await this.pedidoModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }
  }

  async findByCliente(clienteId: string): Promise<Pedido[]> {
    const pedidos = await this.pedidoModel.find({ cliente: new Types.ObjectId(clienteId) })
      .populate('cliente', 'nombre email telefono')
      .populate('productos.producto', 'nombre precio imagen')
      .sort({ fechaPedido: -1 });
    return pedidos;
  }

  async crearDesdeCarrito(carritoDto: {
    clienteId: string;
    productos: Array<{ productoId: string; cantidad: number; precio: number }>;
    direccionEntrega: string;
  }): Promise<Pedido> {
    // Calcular total
    const total = carritoDto.productos.reduce((sum, item) => 
      sum + (item.precio * item.cantidad), 0
    );

    // Crear pedido
    const nuevoPedido = await this.pedidoModel.create({
      cliente: new Types.ObjectId(carritoDto.clienteId),
      productos: carritoDto.productos.map(item => ({
        producto: item.productoId,
        cantidad: item.cantidad,
        precio: item.precio
      })),
      total: total,
      estado: 'pendiente',
      direccionEntrega: carritoDto.direccionEntrega,
      fechaPedido: new Date()
    });

    return await this.findOne((nuevoPedido._id as Types.ObjectId).toString());
  }
}
