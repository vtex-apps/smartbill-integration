# VTEX Smartbill

This application allows you to generate invoices using the Smartbill API.

## Installation & Configuration

- Use the vtex toolbelt to install.

```bash
vtex install vtexeurope.smartbill
```

- Import the vtexeurope.smartbill app to your theme's dependencies in the manifest.json

```json
"dependencies": {
    ....
    "vtexeurope.smartbill" : "0.x"
}
```

## Usage

POST - /smartbill/generate-invoice

Request Example:

```json
{ "order": "Response from /api/oms/pvt/orders/{orderId}" }
```

Response Example:

```json
{
  "errorText": "",
  "message": "",
  "number": "1111",
  "series": "ASD",
  "url": "",
  "encryptedNumber": "YWZjMjk2MjM2NDkwY2JjMTVjZWQ2MDI3ODdkOTI4ODQyYWZlZTI4OTE3NmQ1MWI5NTNiZDVjMDQxMzkzOTdhZjQrQ2NyWjd4cnFqTVhOY1RPWUV6T3c9PTYyZDBlMmQ4ZDY1YjMzNGViNWM3MDFhNmM3ZjM2OTZiNWU5NDU2YzYyZDg5MDRkMGQwNmFmN2E0ZWM1MTM2Yjg="
}
```

GET - /smartbill/show-invoice/:encryptedInvoiceNumber

## Important

> **_NOTE:_** The secret key used to encrypt the invoice number is the Smartbill Token, if the token is changed the previously generated invoices will not be able to decrypt the invoice number. All invoice urls will not show the pdf.
