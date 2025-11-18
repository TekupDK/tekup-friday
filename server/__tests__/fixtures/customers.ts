/**
 * Customer Profile Test Fixtures
 */

export const testCustomer = {
  id: 1,
  name: "Test Hansen",
  email: "test@example.dk",
  phone: "12345678",
  address: "Testvej 123, 2000 Frederiksberg",
  balance: 1745, // Unpaid invoice amount
  summary: `**Kunde Resume**

Test Hansen er kunde siden november 2025 med 2 gennemførte rengøringsjobs.

**Kontakt:**
- Email: test@example.dk
- Telefon: 12345678
- Adresse: Testvej 123, 2000 Frederiksberg

**Økonomi:**
- Balance: 1.745 kr (1 ubetalt faktura)
- Total omsætning: 3.839 kr

**Historik:**
- Flytterengøring (6 timer) - betalt
- Almindelig rengøring (3 timer) - afventer betaling
- God betalingshistorik

**Noter:**
- Foretrækker weekendrengøring
- Har hund (allergivenligt produkt)`,
  createdAt: new Date("2025-11-01T10:00:00Z"),
};

export const vipCustomer = {
  id: 2,
  name: "Anna Sørensen",
  email: "anna@example.dk",
  phone: "30405060",
  address: "Hovedgaden 45, 2100 København Ø",
  balance: 0, // No unpaid invoices
  summary: `**VIP Kunde Resume**

Anna Sørensen er en trofaste kunde med månedlig rengøring siden januar 2025.

**Kontakt:**
- Email: anna@example.dk
- Telefon: 30405060
- Adresse: Hovedgaden 45, 2100 København Ø

**Økonomi:**
- Balance: 0 kr (alle fakturaer betalt)
- Total omsætning: 15.000+ kr
- Månedlig kontrakt: 1.047 kr

**Historik:**
- 10+ gennemførte jobs
- Altid betaler til tiden
- 5-stjernet kunde

**Noter:**
- Fast tid: Hver første mandag kl. 10:00
- Nøgleboks: Kode 1234
- Kat (ingen allergier)`,
  createdAt: new Date("2025-01-15T10:00:00Z"),
};

export const newCustomer = {
  id: 3,
  name: "Peter Jensen",
  email: "peter@example.dk",
  phone: "40506070",
  address: "Strandvejen 100, 2900 Hellerup",
  balance: 0,
  summary: `**Ny Kunde**

Peter Jensen konverteret fra lead i november 2025.

**Kontakt:**
- Email: peter@example.dk
- Telefon: 40506070
- Adresse: Strandvejen 100, 2900 Hellerup

**Status:**
- Første booking planlagt
- Kontrakt underskrevet
- Afventer første rengøring`,
  createdAt: new Date("2025-11-15T10:00:00Z"),
};
