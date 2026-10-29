// Add one object for each real certificate. Keep the array empty until ready.
// Store images and PDFs in assets/certificates/ and use paths relative to this page.
// Example structure (replace every value with your real certificate details):
// {
//   title: "Certificate title",
//   issuer: "Issuing organisation",
//   issued: "2026-10", // optional YYYY-MM; no date is invented when omitted
//   category: "Cloud", // used to build the filter buttons
//   image: "assets/certificates/example.jpg", // optional image preview
//   document: "assets/certificates/example.pdf", // optional PDF
//   credentialUrl: "https://issuer.example/your-credential" // optional verification
// }
window.PORTFOLIO_CERTIFICATES = [];
