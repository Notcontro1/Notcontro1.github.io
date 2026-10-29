# Notcontro1 portfolio

A static GitHub Pages portfolio. Open `index.html` through a local static server, or publish the repository root through GitHub Pages. No build step or package installation is required.

## Pages

- `index.html`: portfolio, project details and the gravity playground.
- `profile.html`: profile placeholders and a photo area. Clicking the Notcontro1 name opens this page.
- `certificates.html`: an initially empty certificate gallery, ready for actual certificates.

## Add your profile

1. Put your photo in `assets/profile/`.
2. Update the strings in `profile-data.js` and set `photo` to its relative path.
3. Commit and push. Empty or broken photo paths keep the placeholder visible.

## Add certificates

1. Put real certificate images or PDFs in `assets/certificates/`.
2. Add objects to the array in `certificates-data.js`, following the example in that file.
3. Commit and push. The page automatically replaces its empty state with the gallery, search, category filters, image previews and available document/verification links.

There is no public upload form: adding files to this repository publishes them for all visitors. No certificate records or issue dates are invented.

## Gravity playground

The optional “Do not press” feature uses vendored Matter.js 0.20.0. Actual rigid bodies fall, collide, stack and bounce. Pointer constraints let visitors pick up and move pieces with a mouse or touch. “Nudge pieces” works with the keyboard as well. “Put it back together” or Escape releases pointer capture, removes the world and restores the original page and scroll position.

Reduced-motion visitors get a settled layout without an automatic falling animation. They can move pieces directly. Simulation pauses when the tab is hidden and stops requesting frames when the bodies settle.

The vendored engine and its MIT license are in `vendor/`. Its public APIs are only called with application-defined options and numeric interaction coordinates.
