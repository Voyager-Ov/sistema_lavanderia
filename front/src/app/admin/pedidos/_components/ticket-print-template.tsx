import React from "react"
import { Pedido, Ticket } from "@/domains/pedidos/api"
import QRCode from "react-qr-code"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useConfigStore } from "@/app/admin/configuraciones/_store/useConfigStore"
import { formatCurrency } from "@/shared/lib/utils"
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

    const ticketStyle: React.CSSProperties = {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: previewMode ? '12px' : '11pt',
      lineHeight: '1.4',
      color: 'black',
      backgroundColor: 'white',
      width: previewMode ? '260px' : '100%',
      padding: previewMode ? '20px 14px' : '0',
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
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                background: white;
              }
              .print-container {
                width: 100%;
                max-width: 100%;
                margin: 0;
                padding: 0;
                color: black;
                font-family: 'Courier New', Courier, monospace;
                font-size: 11pt;
                line-height: 1.4;
              }
              .ticket-page {
                page-break-after: always;
                padding: 5mm;
                box-sizing: border-box;
              }
              .ticket-page:last-child {
                page-break-after: auto;
              }
              body * { visibility: hidden; }
              .print-container, .print-container * { visibility: visible; }
              .print-container { position: absolute; left: 0; top: 0; }
            `}
          </style>
        )}

        {tickets.map((ticket, index) => {
          const qrUrl = `${trackingBaseUrl}/${ticket.codigo}`
          const activeTemplate = hardwareConfig.mensajeTicket || DEFAULT_TICKET_TEMPLATE;

          // 32 chars is standard width for 58mm thermal printers
          const itemsStr = pedido.items?.map(item => {
            const qty = `${item.cantidad}x `;
            const name = (item.producto?.nombre || 'Item').substring(0, 18);
            const left = `${qty}${name}`;
            const right = formatCurrency(item.subtotal);
            const paddingLength = Math.max(1, 32 - left.length - right.length);
            return `${left}${' '.repeat(paddingLength)}${right}`;
          }).join('\n') || '';

          const parsedText = activeTemplate
            .replace(/\{\{razonSocial\}\}/g, (businessConfig.razonSocial || 'LAVANDERÍA').toUpperCase())
            .replace(/\{\{cliente\}\}/g, pedido.cliente?.nombre || 'Consumidor Final')
            .replace(/\{\{fecha\}\}/g, format(new Date(pedido.createdAt), "dd/MM/yyyy"))
            .replace(/\{\{hora\}\}/g, format(new Date(pedido.createdAt), "HH:mm"))
            .replace(/\{\{total\}\}/g, formatCurrency(pedido.total))
            .replace(/\{\{nro_pedido\}\}/g, `#${pedido.codigoSeguimiento}`)
            .replace(/\{\{bulto\}\}/g, `${index + 1} de ${tickets.length}`)
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
                    whiteSpace: 'pre-wrap', // allow wrap if line is too long, but pre preserves spacing
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
                    <QRCode value={qrUrl} size={previewMode ? 90 : 100} level="M" />
                  </div>
                  <div style={{ fontSize: '9px', marginTop: '4px', color: '#9ca3af', letterSpacing: '1px' }}>
                    {ticket.codigo}
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
