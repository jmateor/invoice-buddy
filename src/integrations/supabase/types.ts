export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          accion: string
          created_at: string
          detalles: Json | null
          entidad: string
          entidad_id: string | null
          id: string
          ip: string | null
          user_id: string
        }
        Insert: {
          accion: string
          created_at?: string
          detalles?: Json | null
          entidad: string
          entidad_id?: string | null
          id?: string
          ip?: string | null
          user_id: string
        }
        Update: {
          accion?: string
          created_at?: string
          detalles?: Json | null
          entidad?: string
          entidad_id?: string | null
          id?: string
          ip?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          user_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          rnc_cedula: string | null
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          rnc_cedula?: string | null
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          rnc_cedula?: string | null
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compras: {
        Row: {
          created_at: string
          fecha: string
          fecha_pago: string | null
          forma_pago: string
          id: string
          isc: number
          isr_percibido: number
          itbis_costo: number
          itbis_facturado: number
          itbis_percibido: number
          itbis_proporcionalidad: number
          itbis_retenido: number
          monto_bienes: number
          monto_retencion_isr: number
          monto_servicios: number
          ncf: string | null
          ncf_modificado: string | null
          notas: string | null
          otros_impuestos: number
          propina_legal: number
          proveedor_id: string
          tipo_bienes_servicios: string | null
          tipo_retencion_isr: string | null
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          fecha?: string
          fecha_pago?: string | null
          forma_pago?: string
          id?: string
          isc?: number
          isr_percibido?: number
          itbis_costo?: number
          itbis_facturado?: number
          itbis_percibido?: number
          itbis_proporcionalidad?: number
          itbis_retenido?: number
          monto_bienes?: number
          monto_retencion_isr?: number
          monto_servicios?: number
          ncf?: string | null
          ncf_modificado?: string | null
          notas?: string | null
          otros_impuestos?: number
          propina_legal?: number
          proveedor_id: string
          tipo_bienes_servicios?: string | null
          tipo_retencion_isr?: string | null
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          fecha?: string
          fecha_pago?: string | null
          forma_pago?: string
          id?: string
          isc?: number
          isr_percibido?: number
          itbis_costo?: number
          itbis_facturado?: number
          itbis_percibido?: number
          itbis_proporcionalidad?: number
          itbis_retenido?: number
          monto_bienes?: number
          monto_retencion_isr?: number
          monto_servicios?: number
          ncf?: string | null
          ncf_modificado?: string | null
          notas?: string | null
          otros_impuestos?: number
          propina_legal?: number
          proveedor_id?: string
          tipo_bienes_servicios?: string | null
          tipo_retencion_isr?: string | null
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compras_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_negocio: {
        Row: {
          created_at: string
          direccion: string | null
          email: string | null
          formato_impresion: string | null
          id: string
          impresion_automatica: boolean
          itbis_rate: number
          logo_url: string | null
          mensaje_factura: string | null
          moneda: string
          nombre_comercial: string
          razon_social: string | null
          rnc: string | null
          telefono: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          formato_impresion?: string | null
          id?: string
          impresion_automatica?: boolean
          itbis_rate?: number
          logo_url?: string | null
          mensaje_factura?: string | null
          moneda?: string
          nombre_comercial?: string
          razon_social?: string | null
          rnc?: string | null
          telefono?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          formato_impresion?: string | null
          id?: string
          impresion_automatica?: boolean
          itbis_rate?: number
          logo_url?: string | null
          mensaje_factura?: string | null
          moneda?: string
          nombre_comercial?: string
          razon_social?: string | null
          rnc?: string | null
          telefono?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      detalle_compras: {
        Row: {
          cantidad: number
          compra_id: string
          id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
        }
        Insert: {
          cantidad?: number
          compra_id: string
          id?: string
          precio_unitario: number
          producto_id: string
          subtotal?: number
        }
        Update: {
          cantidad?: number
          compra_id?: string
          id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "detalle_compras_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_compras_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_facturas: {
        Row: {
          cantidad: number
          factura_id: string
          id: string
          itbis: number
          precio_unitario: number
          producto_id: string
          subtotal: number
        }
        Insert: {
          cantidad?: number
          factura_id: string
          id?: string
          itbis?: number
          precio_unitario: number
          producto_id: string
          subtotal?: number
        }
        Update: {
          cantidad?: number
          factura_id?: string
          id?: string
          itbis?: number
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "detalle_facturas_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_facturas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_notas_credito: {
        Row: {
          cantidad: number
          id: string
          itbis: number
          nota_credito_id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
        }
        Insert: {
          cantidad?: number
          id?: string
          itbis?: number
          nota_credito_id: string
          precio_unitario: number
          producto_id: string
          subtotal?: number
        }
        Update: {
          cantidad?: number
          id?: string
          itbis?: number
          nota_credito_id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "detalle_notas_credito_nota_credito_id_fkey"
            columns: ["nota_credito_id"]
            isOneToOne: false
            referencedRelation: "notas_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_notas_credito_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      dgii_catalogos: {
        Row: {
          catalogo: string
          codigo: string
          descripcion: string
          id: string
          orden: number
        }
        Insert: {
          catalogo: string
          codigo: string
          descripcion: string
          id?: string
          orden?: number
        }
        Update: {
          catalogo?: string
          codigo?: string
          descripcion?: string
          id?: string
          orden?: number
        }
        Relationships: []
      }
      dgii_periodos_remitidos: {
        Row: {
          archivo_excel_path: string | null
          archivo_txt_path: string | null
          cantidad_registros: number
          created_at: string
          estado: string
          fecha_generacion: string | null
          fecha_remision: string | null
          id: string
          notas: string | null
          periodo: string
          tipo: string
          total_itbis: number
          total_monto: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archivo_excel_path?: string | null
          archivo_txt_path?: string | null
          cantidad_registros?: number
          created_at?: string
          estado?: string
          fecha_generacion?: string | null
          fecha_remision?: string | null
          id?: string
          notas?: string | null
          periodo: string
          tipo: string
          total_itbis?: number
          total_monto?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archivo_excel_path?: string | null
          archivo_txt_path?: string | null
          cantidad_registros?: number
          created_at?: string
          estado?: string
          fecha_generacion?: string | null
          fecha_remision?: string | null
          id?: string
          notas?: string | null
          periodo?: string
          tipo?: string
          total_itbis?: number
          total_monto?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ecf_configuracion: {
        Row: {
          activo: boolean
          ambiente: string
          certificado_nombre: string | null
          certificado_password_encrypted: string | null
          certificado_path: string | null
          certificado_vigencia_hasta: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          municipio: string | null
          nombre_comercial: string | null
          provincia: string | null
          razon_social: string
          rnc: string
          telefono: string | null
          updated_at: string
          url_anulacion: string | null
          url_aprobacion_comercial: string | null
          url_autenticacion: string | null
          url_consulta_estado: string | null
          url_recepcion: string | null
          user_id: string
        }
        Insert: {
          activo?: boolean
          ambiente?: string
          certificado_nombre?: string | null
          certificado_password_encrypted?: string | null
          certificado_path?: string | null
          certificado_vigencia_hasta?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          municipio?: string | null
          nombre_comercial?: string | null
          provincia?: string | null
          razon_social: string
          rnc: string
          telefono?: string | null
          updated_at?: string
          url_anulacion?: string | null
          url_aprobacion_comercial?: string | null
          url_autenticacion?: string | null
          url_consulta_estado?: string | null
          url_recepcion?: string | null
          user_id: string
        }
        Update: {
          activo?: boolean
          ambiente?: string
          certificado_nombre?: string | null
          certificado_password_encrypted?: string | null
          certificado_path?: string | null
          certificado_vigencia_hasta?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          municipio?: string | null
          nombre_comercial?: string | null
          provincia?: string | null
          razon_social?: string
          rnc?: string
          telefono?: string | null
          updated_at?: string
          url_anulacion?: string | null
          url_aprobacion_comercial?: string | null
          url_autenticacion?: string | null
          url_consulta_estado?: string | null
          url_recepcion?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ecf_documentos: {
        Row: {
          ambiente: string
          codigo_respuesta: string | null
          created_at: string
          encf: string
          estado_dgii: string
          factura_id: string | null
          fecha_anulacion: string | null
          fecha_emision: string
          fecha_envio: string | null
          fecha_respuesta: string | null
          hash_firma: string | null
          id: string
          intentos_envio: number
          mensaje_dgii: string | null
          monto_itbis: number
          monto_subtotal: number
          monto_total: number
          nota_credito_id: string | null
          receptor_nombre: string | null
          receptor_rnc: string | null
          tipo_ecf: string
          track_id: string | null
          updated_at: string
          user_id: string
          xml_firmado: string | null
          xml_sin_firma: string | null
        }
        Insert: {
          ambiente?: string
          codigo_respuesta?: string | null
          created_at?: string
          encf: string
          estado_dgii?: string
          factura_id?: string | null
          fecha_anulacion?: string | null
          fecha_emision?: string
          fecha_envio?: string | null
          fecha_respuesta?: string | null
          hash_firma?: string | null
          id?: string
          intentos_envio?: number
          mensaje_dgii?: string | null
          monto_itbis?: number
          monto_subtotal?: number
          monto_total?: number
          nota_credito_id?: string | null
          receptor_nombre?: string | null
          receptor_rnc?: string | null
          tipo_ecf: string
          track_id?: string | null
          updated_at?: string
          user_id: string
          xml_firmado?: string | null
          xml_sin_firma?: string | null
        }
        Update: {
          ambiente?: string
          codigo_respuesta?: string | null
          created_at?: string
          encf?: string
          estado_dgii?: string
          factura_id?: string | null
          fecha_anulacion?: string | null
          fecha_emision?: string
          fecha_envio?: string | null
          fecha_respuesta?: string | null
          hash_firma?: string | null
          id?: string
          intentos_envio?: number
          mensaje_dgii?: string | null
          monto_itbis?: number
          monto_subtotal?: number
          monto_total?: number
          nota_credito_id?: string | null
          receptor_nombre?: string | null
          receptor_rnc?: string | null
          tipo_ecf?: string
          track_id?: string | null
          updated_at?: string
          user_id?: string
          xml_firmado?: string | null
          xml_sin_firma?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecf_documentos_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecf_documentos_nota_credito_id_fkey"
            columns: ["nota_credito_id"]
            isOneToOne: false
            referencedRelation: "notas_credito"
            referencedColumns: ["id"]
          },
        ]
      }
      ecf_historial_estados: {
        Row: {
          codigo_respuesta: string | null
          created_at: string
          datos_respuesta: Json | null
          ecf_documento_id: string
          estado_anterior: string | null
          estado_nuevo: string
          id: string
          mensaje: string | null
          user_id: string
        }
        Insert: {
          codigo_respuesta?: string | null
          created_at?: string
          datos_respuesta?: Json | null
          ecf_documento_id: string
          estado_anterior?: string | null
          estado_nuevo: string
          id?: string
          mensaje?: string | null
          user_id: string
        }
        Update: {
          codigo_respuesta?: string | null
          created_at?: string
          datos_respuesta?: Json | null
          ecf_documento_id?: string
          estado_anterior?: string | null
          estado_nuevo?: string
          id?: string
          mensaje?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecf_historial_estados_ecf_documento_id_fkey"
            columns: ["ecf_documento_id"]
            isOneToOne: false
            referencedRelation: "ecf_documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      ecf_secuencias: {
        Row: {
          activo: boolean
          created_at: string
          fecha_vencimiento: string | null
          id: string
          prefijo: string
          secuencia_actual: number
          secuencia_desde: number
          secuencia_hasta: number
          tipo_ecf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          fecha_vencimiento?: string | null
          id?: string
          prefijo?: string
          secuencia_actual?: number
          secuencia_desde?: number
          secuencia_hasta?: number
          tipo_ecf: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          fecha_vencimiento?: string | null
          id?: string
          prefijo?: string
          secuencia_actual?: number
          secuencia_desde?: number
          secuencia_hasta?: number
          tipo_ecf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      facturas: {
        Row: {
          cliente_id: string
          created_at: string
          descuento: number
          estado: Database["public"]["Enums"]["estado_factura"]
          fecha: string
          fecha_anulacion: string | null
          fecha_retencion: string | null
          id: string
          isc: number
          isr_percibido: number
          itbis: number
          itbis_percibido: number
          itbis_retenido_terceros: number
          metodo_pago: Database["public"]["Enums"]["metodo_pago"]
          monto_bonos: number
          monto_cheque: number
          monto_credito: number
          monto_efectivo: number
          monto_otros: number
          monto_permuta: number
          monto_tarjeta: number
          motivo_anulacion: string | null
          ncf: string | null
          ncf_modificado: string | null
          nota_credito_id: string | null
          notas: string | null
          numero: string
          otros_impuestos: number
          propina_legal: number
          retencion_isr_terceros: number
          subtotal: number
          tipo_comprobante: string | null
          tipo_ingreso: string
          total: number
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descuento?: number
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha?: string
          fecha_anulacion?: string | null
          fecha_retencion?: string | null
          id?: string
          isc?: number
          isr_percibido?: number
          itbis?: number
          itbis_percibido?: number
          itbis_retenido_terceros?: number
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"]
          monto_bonos?: number
          monto_cheque?: number
          monto_credito?: number
          monto_efectivo?: number
          monto_otros?: number
          monto_permuta?: number
          monto_tarjeta?: number
          motivo_anulacion?: string | null
          ncf?: string | null
          ncf_modificado?: string | null
          nota_credito_id?: string | null
          notas?: string | null
          numero: string
          otros_impuestos?: number
          propina_legal?: number
          retencion_isr_terceros?: number
          subtotal?: number
          tipo_comprobante?: string | null
          tipo_ingreso?: string
          total?: number
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descuento?: number
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha?: string
          fecha_anulacion?: string | null
          fecha_retencion?: string | null
          id?: string
          isc?: number
          isr_percibido?: number
          itbis?: number
          itbis_percibido?: number
          itbis_retenido_terceros?: number
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"]
          monto_bonos?: number
          monto_cheque?: number
          monto_credito?: number
          monto_efectivo?: number
          monto_otros?: number
          monto_permuta?: number
          monto_tarjeta?: number
          motivo_anulacion?: string | null
          ncf?: string | null
          ncf_modificado?: string | null
          nota_credito_id?: string | null
          notas?: string | null
          numero?: string
          otros_impuestos?: number
          propina_legal?: number
          retencion_isr_terceros?: number
          subtotal?: number
          tipo_comprobante?: string | null
          tipo_ingreso?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_nota_credito_id_fkey"
            columns: ["nota_credito_id"]
            isOneToOne: false
            referencedRelation: "notas_credito"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          producto_id: string
          referencia: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo_movimiento: string
          usuario_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          producto_id: string
          referencia?: string | null
          stock_anterior?: number
          stock_nuevo?: number
          tipo_movimiento: string
          usuario_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          producto_id?: string
          referencia?: string | null
          stock_anterior?: number
          stock_nuevo?: number
          tipo_movimiento?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      ncf_secuencias: {
        Row: {
          activo: boolean
          created_at: string
          estado: string
          fecha_autorizacion: string | null
          fecha_vencimiento: string | null
          id: string
          nombre: string | null
          numeracion_automatica: boolean
          pie_factura: string | null
          preferida: boolean
          prefijo: string
          secuencia_actual: number
          secuencia_limite: number
          serie: string
          sucursal: string | null
          tipo_comprobante: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          estado?: string
          fecha_autorizacion?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre?: string | null
          numeracion_automatica?: boolean
          pie_factura?: string | null
          preferida?: boolean
          prefijo?: string
          secuencia_actual?: number
          secuencia_limite?: number
          serie?: string
          sucursal?: string | null
          tipo_comprobante: string
          user_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          estado?: string
          fecha_autorizacion?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre?: string | null
          numeracion_automatica?: boolean
          pie_factura?: string | null
          preferida?: boolean
          prefijo?: string
          secuencia_actual?: number
          secuencia_limite?: number
          serie?: string
          sucursal?: string | null
          tipo_comprobante?: string
          user_id?: string
        }
        Relationships: []
      }
      notas_credito: {
        Row: {
          cliente_id: string
          created_at: string
          estado: string
          factura_id: string
          id: string
          motivo: string
          numero: string | null
          saldo_disponible: number
          total: number
          usuario_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          estado?: string
          factura_id: string
          id?: string
          motivo: string
          numero?: string | null
          saldo_disponible?: number
          total?: number
          usuario_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          estado?: string
          factura_id?: string
          id?: string
          motivo?: string
          numero?: string | null
          saldo_disponible?: number
          total?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_credito_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_credito_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_servicio: {
        Row: {
          cliente_id: string
          costo_estimado: number
          created_at: string
          diagnostico: string | null
          equipo_descripcion: string
          estado: string
          factura_id: string | null
          fecha_entrada: string
          fecha_entrega: string | null
          fecha_notificacion: string | null
          id: string
          marca: string | null
          modelo: string | null
          notas: string | null
          problema_reportado: string
          serial: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          costo_estimado?: number
          created_at?: string
          diagnostico?: string | null
          equipo_descripcion: string
          estado?: string
          factura_id?: string | null
          fecha_entrada?: string
          fecha_entrega?: string | null
          fecha_notificacion?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          notas?: string | null
          problema_reportado: string
          serial?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          costo_estimado?: number
          created_at?: string
          diagnostico?: string | null
          equipo_descripcion?: string
          estado?: string
          factura_id?: string | null
          fecha_entrada?: string
          fecha_entrega?: string | null
          fecha_notificacion?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          notas?: string | null
          problema_reportado?: string
          serial?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_servicio_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_factura: {
        Row: {
          created_at: string
          factura_id: string
          fecha: string
          id: string
          metodo_pago: string
          monto: number
          referencia: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          factura_id: string
          fecha?: string
          id?: string
          metodo_pago?: string
          monto?: number
          referencia?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          factura_id?: string
          fecha?: string
          id?: string
          metodo_pago?: string
          monto?: number
          referencia?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_factura_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria_id: string | null
          codigo_barras: string | null
          condiciones_garantia: string | null
          costo: number
          created_at: string
          descripcion: string | null
          garantia_descripcion: string | null
          id: string
          itbis_aplicable: boolean
          nombre: string
          precio: number
          stock: number
          stock_minimo: number
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria_id?: string | null
          codigo_barras?: string | null
          condiciones_garantia?: string | null
          costo?: number
          created_at?: string
          descripcion?: string | null
          garantia_descripcion?: string | null
          id?: string
          itbis_aplicable?: boolean
          nombre: string
          precio?: number
          stock?: number
          stock_minimo?: number
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria_id?: string | null
          codigo_barras?: string | null
          condiciones_garantia?: string | null
          costo?: number
          created_at?: string
          descripcion?: string | null
          garantia_descripcion?: string | null
          id?: string
          itbis_aplicable?: boolean
          nombre?: string
          precio?: number
          stock?: number
          stock_minimo?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          avatar_url: string | null
          cedula: string | null
          created_at: string
          email: string | null
          fecha_desactivacion: string | null
          id: string
          nombre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          avatar_url?: string | null
          cedula?: string | null
          created_at?: string
          email?: string | null
          fecha_desactivacion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          avatar_url?: string | null
          cedula?: string | null
          created_at?: string
          email?: string | null
          fecha_desactivacion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          rnc: string | null
          telefono: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          rnc?: string | null
          telefono?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          rnc?: string | null
          telefono?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_stock: {
        Args: { amount: number; p_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_encf: {
        Args: { p_tipo: string; p_user_id: string }
        Returns: string
      }
      next_invoice_number: { Args: { p_user_id: string }; Returns: string }
      next_ncf: { Args: { p_tipo: string; p_user_id: string }; Returns: string }
      validar_secuencia_ncf: {
        Args: { p_tipo: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "cajero" | "contador"
      estado_factura:
        | "activa"
        | "anulada"
        | "borrador"
        | "emitida"
        | "enviada_dgii"
        | "aceptada"
        | "rechazada"
        | "cobrada"
      metodo_pago: "efectivo" | "tarjeta" | "transferencia" | "nota_credito"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "cajero", "contador"],
      estado_factura: [
        "activa",
        "anulada",
        "borrador",
        "emitida",
        "enviada_dgii",
        "aceptada",
        "rechazada",
        "cobrada",
      ],
      metodo_pago: ["efectivo", "tarjeta", "transferencia", "nota_credito"],
    },
  },
} as const
