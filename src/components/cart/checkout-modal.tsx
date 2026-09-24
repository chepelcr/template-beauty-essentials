import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/store/cart";
import { generateWhatsAppMessage } from "@/lib/whatsapp";
import { whatsappPhone, whatsappUrl } from "@chepelcr/tsuru-storefront-sdk";
import { useContact } from "@/hooks/useContent";
import { useSubdomainContext } from "@/contexts/SubdomainContext";
import { getApiClient } from "@/lib/api";
import CheckoutAddress, {
  type AddressNames,
  type StructuredAddress,
} from "@/components/cart/checkout-address";

const EMPTY_ADDRESS: StructuredAddress = {
  state_id: null,
  county_id: null,
  district_id: null,
  neighborhood_id: null,
  address: "",
};

const EMPTY_NAMES: AddressNames = {
  state_name: "",
  county_name: "",
  district_name: "",
  neighborhood_name: "",
};

export default function CheckoutModal() {
  const { data: contact } = useContact();
  const { config } = useSubdomainContext();
  const [submitting, setSubmitting] = useState(false);
  const { showCheckout, setShowCheckout, items, total, clearCart } =
    useCartStore();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    deliveryMethod: "",
  });
  const [address, setAddress] = useState<StructuredAddress>(EMPTY_ADDRESS);
  const [addressNames, setAddressNames] = useState<AddressNames>(EMPTY_NAMES);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const requiredFields = ["customerName", "customerPhone", "deliveryMethod"];

    const missingBasic = requiredFields.some(
      (field) => !formData[field as keyof typeof formData],
    );
    const missingAddress =
      address.state_id == null ||
      address.county_id == null ||
      address.district_id == null ||
      !address.address;

    if (missingBasic || missingAddress) {
      {
        alert("Por favor completa todos los campos");
        return;
      }
    }

    if (items.length === 0) {
      alert("No tienes productos en tu carrito");
      return;
    }

    // Generate WhatsApp message with location names
    // Place the order with the store first — same structured address
    // (provincia/cantón/distrito/barrio ids) as an internal order — then hand
    // its tracking number to WhatsApp. The WhatsApp tab opens now, inside the
    // click, so popup blockers let it through after the request.
    const storePhone = whatsappPhone(contact);
    const waWindow = storePhone ? window.open("", "_blank") : null;
    let trackingNumber: string | null = null;
    if (config && config.mode !== "demo" && config.orgId) {
      setSubmitting(true);
      try {
        const order = await getApiClient("prod", config.orgId).createOrder({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          deliveryMethod: formData.deliveryMethod || null,
          address: {
            stateId: address.state_id,
            countyId: address.county_id,
            districtId: address.district_id,
            neighborhoodId: address.neighborhood_id,
            address: address.address,
          },
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
          comment: null,
        });
        trackingNumber = order.trackingNumber;
      } catch {
        waWindow?.close();
        alert("No pudimos registrar tu pedido. Intentá de nuevo en un momento.");
        return;
      } finally {
        setSubmitting(false);
      }
    }

    const message = generateWhatsAppMessage({
      items,
      total,
      customer: {
        name: formData.customerName,
        phone: formData.customerPhone,
      },
      delivery: {
        provincia: addressNames.state_name,
        canton: addressNames.county_name,
        distrito: addressNames.district_name,
        barrio: addressNames.neighborhood_name,
        address: address.address,
        method: formData.deliveryMethod,
      },
    });

    const handoff = trackingNumber ? `Pedido #${trackingNumber}\n\n${message}` : message;
    if (storePhone && waWindow) {
      waWindow.location.href = whatsappUrl(storePhone, handoff);
    } else if (trackingNumber) {
      alert(`Pedido #${trackingNumber} registrado. La tienda te contactará al ${formData.customerPhone}.`);
    } else {
      alert("Esta tienda todavía no configuró un número de WhatsApp para recibir pedidos.");
      return;
    }

    // Clear cart and close modal
    clearCart();
    setShowCheckout(false);

    // Reset form
    setFormData({
      customerName: "",
      customerPhone: "",
      deliveryMethod: "",
    });
    setAddress(EMPTY_ADDRESS);
    setAddressNames(EMPTY_NAMES);

    alert("Tu pedido ha sido enviado por WhatsApp");
  };

  return (
    <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            Finalizar Compra
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h5 className="font-medium text-gray-900 mb-4">
              Información Personal
            </h5>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nombre Completo</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) =>
                    handleInputChange("customerName", e.target.value)
                  }
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Teléfono</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    handleInputChange("customerPhone", e.target.value)
                  }
                  placeholder="8888-8888"
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div>
            <h5 className="font-medium text-gray-900 mb-4">
              Información de Entrega
            </h5>
            <CheckoutAddress
              value={address}
              onChange={setAddress}
              onNamesChange={setAddressNames}
            />
            <div className="mt-4">
              <Label htmlFor="deliveryMethod">Método de Entrega</Label>
              <Select
                value={formData.deliveryMethod}
                onValueChange={(value) => handleInputChange("deliveryMethod", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="correos">Correos Costa Rica</SelectItem>
                  <SelectItem value="uber-flash">Uber Flash</SelectItem>
                  <SelectItem value="personal">Entrega Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center text-lg font-semibold mb-4">
              <span>Total del Pedido:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 px-6 h-auto font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>Enviar Pedido por WhatsApp</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
