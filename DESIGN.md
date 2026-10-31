# Beauty Essentials — design plan

**Concept: Espejo.** A vanity mirror. The hero photo sits in an arched
mirror with a chrome rim, and a soft glint crosses the glass toward the
pointer; every product and treatment is framed by the same arch; categories
("rituales") are small arched mirrors with a rim in their own colour. Lots of
air, one cherry accent.

Serves: cosmetics and skincare shops, salons and spas, nail and lash studios —
products next to treatments sold as services, each with its duration.

## Palette

| Token | Hex | Role |
|---|---|---|
| cherry | `#A3122B` | the store's accent (org primary): main buttons, cart, active nav dot |
| petal | `#F2D4D8` | quiet surfaces, cart count, CTA button on plum |
| chrome | `#BFC3C9` | the mirror rim (with a light metal sheen) |
| milk | `#FBF8F6` | page |
| plum ink | `#2B1A22` | text, footer, CTA block |

Dark mode (`:root[data-color-scheme='dark']`): plum glass `#1B1216`, raised
`#2F2228` (`darkSurface`), ink `#F6ECEE`, offers `#F27C8E`.

Contrast (computed): plum on milk 15.6:1 · soft plum `#6E5560` on milk 6.3:1 ·
cherry on milk 7.4:1 · white on cherry 7.8:1 · plum on petal 11.9:1 · dark:
ink on glass 15.9:1, soft `#CDB7BE` 9.7:1, offers `#F27C8E` 7.0:1.

## Type

**Syne** (500–800) for display — wide and editorial — and **Hanken Grotesk**
for text. No all-caps eyebrows, no monospace.

## Layout

```
HOME
 Cuidado y belleza                         ╭─ chrome rim ─╮
 Tu rutina, con luz propia                 │  arched glass │  (glint follows
 [Ver productos] [Reservar un tratamiento] │  hero photo   │   the pointer)
                                           ╰───────────────╯
 Rituales: five arched mirrors, rims in each category's colour
 En el tocador: arch-framed cards, 4 across (2 on phones); treatments show
           their duration
 highlights in one hairline grid · arched story photo · plum CTA
CATALOG: title + count │ search + Filtros (sheet on phones) │ chips │ groups
headed by a small arch │ the same cards
PRODUCT: the photo in the mirror │ name, price, duration, text, facts, add
```

## Signature

`Mirror` (`.mirror`, `.mirror-glass::after`): the glint's position is one CSS
variable (`--glint-x`) set on pointer move, one rAF per move, only while the
mirror is on screen; touch screens and reduced motion get a resting glint.
Adding to the order answers with a ripple from where the button was pressed.
No WebGL.

Account and barter links live in the header (Trueque in the navigation, the
account as an icon; both in the phone menu), like every Tsuru template.

## Changed from the generic default

- Left "cream + high-contrast serif + terracotta": milk and plum with a wide
  grotesque display face and a single cherry accent.
- One shape — the arch — instead of a card kit.
- The old merchant sign-in pages are gone; their URLs redirect home, and
  customers sign in with their Tsuru account.
