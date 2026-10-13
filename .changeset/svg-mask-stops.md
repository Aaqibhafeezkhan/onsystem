---
'onsystem': patch
---

`no-hardcoded-color` no longer flags white and black gradient stops inside an SVG `<mask>`, or in a gradient a mask references through `fill="url(#id)"`: there they set the mask's opacity, not a color. Thanks to @CRYPTONIKAV (#110).
