import React from "react"
import { Pedido, Ticket } from "@/domains/pedidos/api"
import QRCode from "react-qr-code"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useConfigStore } from "@/app/admin/configuraciones/_store/useConfigStore"
import { formatCurrency, safeFormatDate } from "@/shared/lib/utils"
import { DEFAULT_TICKET_TEMPLATE } from "@/app/admin/configuraciones/_components/forms/HardwareForm"

interface TicketPrintTemplateProps {
  pedido: Pedido
  tickets: Ticket[]
  trackingBaseUrl: string
  previewMode?: boolean
}

export const TicketPrintTemplate = React.forwardRef<HTMLDivElement, TicketPrintTemplateProps>(
  ({ pedido, tickets, trackingBaseUrl, previewMode = false }, ref) => {

    const { hardwareConfig, businessConfig } = useConfigStore()
    const is58mm = hardwareConfig.anchoPapel === '58mm';
    const paperWidth = hardwareConfig.anchoPapel || '80mm';

    const ticketStyle: React.CSSProperties = {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: is58mm ? '11px' : '12px',
      lineHeight: '1.4',
      color: 'black',
      backgroundColor: 'white',
      width: is58mm ? '220px' : '280px',
      maxWidth: '100%',
      padding: is58mm ? '12px 14px' : '16px 18px',
      margin: '0 auto',
      boxSizing: 'border-box'
    }

    return (
      <div
        ref={ref}
        className={previewMode ? 'mx-auto border border-gray-200 shadow-sm rounded' : 'print-container'}
      >
        {/* Print CSS */}
        {!previewMode && (
          <style type="text/css" media="print">
            {`
              @page {
                size: ${paperWidth} auto;
                margin: 0;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                height: 100% !important;
                overflow: hidden !important;
              }
              .print-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: 0 !important;
                color: black !important;
                font-family: 'Courier New', Courier, monospace;
                font-size: ${is58mm ? '10pt' : '11pt'};
                line-height: 1.4;
                position: fixed !important;
                left: 0 !important;
                right: 0 !important;
                top: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                background: white !important;
                z-index: 999999 !important;
              }
              .ticket-page {
                width: ${is58mm ? '220px' : '280px'} !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: ${is58mm ? '12px 14px' : '16px 18px'} !important;
                box-sizing: border-box !important;
                page-break-after: avoid;
                break-after: avoid;
              }
              .ticket-page:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              body * { visibility: hidden !important; }
              .print-container, .print-container * { visibility: visible !important; }
            `}
          </style>
        )}

        {(tickets.length > 0 ? [tickets[0]] : [{ id: 1, codigo: pedido.codigoSeguimiento || 'TAG-1' }]).map((ticket) => {
          const negocioId = (pedido as any).negocioId || 1;
          const orderCode = pedido.codigoSeguimiento || (pedido as any).numeroPedido || ticket.codigo;
          const origin = typeof window !== 'undefined' ? window.location.origin : (trackingBaseUrl || '');
          const cleanBase = origin.startsWith('http') ? origin : `http://localhost:3000`;
          const qrUrl = `${cleanBase}/tracking/${negocioId}/${orderCode}`;
          
          const activeTemplate = hardwareConfig.mensajeTicket || DEFAULT_TICKET_TEMPLATE;

          // 32 chars for 58mm, 48 chars for 80mm
          const maxCols = is58mm ? 32 : 48;
          const maxNameLen = is58mm ? 18 : 32;

          const itemsStr = pedido.items?.map(item => {
            const qty = `${item.cantidad}x `;
            const name = (item.producto?.nombre || (item as any).servicio?.nombre || 'Item').substring(0, maxNameLen);
            const left = `${qty}${name}`;
            const right = formatCurrency(item.subtotal);
            const paddingLength = Math.max(1, maxCols - left.length - right.length);
            return `${left}${' '.repeat(paddingLength)}${right}`;
          }).join('\n') || '';

          const parsedText = activeTemplate
            .replace(/\{\{razonSocial\}\}/g, (businessConfig.razonSocial || 'LAVANDERÍA').toUpperCase())
            .replace(/\{\{cliente\}\}/g, pedido.cliente?.nombre || 'Consumidor Final')
            .replace(/\{\{fecha\}\}/g, safeFormatDate(pedido.createdAt || (pedido as any).fechaHoraCreacion, "dd/MM/yyyy"))
            .replace(/\{\{hora\}\}/g, safeFormatDate(pedido.createdAt || (pedido as any).fechaHoraCreacion, "HH:mm"))
            .replace(/\{\{total\}\}/g, formatCurrency(pedido.total))
            .replace(/\{\{nro_pedido\}\}/g, `#${orderCode}`)
            .replace(/Bulto:\s*\{\{bulto\}\}\n?/g, '')
            .replace(/\{\{bulto\}\}/g, '')
            .replace(/\{\{estado\}\}/g, pedido.cobrado ? 'PAGADO' : 'PENDIENTE DE PAGO')
            .replace(/\{\{estado_pedido\}\}/g, (pedido.estado || 'PENDIENTE').replace(/_/g, ' '))
            .replace(/\{\{detalle\}\}/g, itemsStr);

          const lines = parsedText.split('\n');

          return (
            <div key={ticket.id} className="ticket-page" style={ticketStyle}>
              {lines.map((line, i) => {
                let isCentered = false;
                let isBold = false;
                
                if (i < 2 || line.includes('***') || line.includes('Gracias')) {
                  isCentered = true;
                }
                if (i === 0 || line.includes('TOTAL') || line.includes('Detalle:') || line.includes('***')) {
                  isBold = true;
                }

                return (
                  <div key={i} style={{ 
                    textAlign: isCentered ? 'center' : 'left',
                    fontWeight: isBold ? 'bold' : 'normal',
                    whiteSpace: 'pre-wrap',
                    minHeight: previewMode ? '14px' : '12px'
                  }}>
                    {line}
                  </div>
                );
              })}

              {/* ─── QR ─────────────────────────────────────── */}
              {hardwareConfig.showQr && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
                    Escanea para seguir tu pedido:
                  </div>
                  <div style={{ border: '2px solid black', padding: '6px', display: 'inline-block', backgroundColor: 'white' }}>
                    <QRCode value={qrUrl} size={previewMode ? (is58mm ? 80 : 90) : (is58mm ? 90 : 100)} level="M" />
                  </div>
                  <div style={{ fontSize: '9px', marginTop: '4px', color: '#9ca3af', letterSpacing: '1px' }}>
                    {orderCode}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }
)

TicketPrintTemplate.displayName = "TicketPrintTemplate"
