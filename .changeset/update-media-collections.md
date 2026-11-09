---
"@vexcms/core": patch
---

`update` now finds media collections. The admin edit view saves a media document (an image's
`alt`, say) through `vex:update`, which only searched `config.collections`, so every media edit
threw `No collection registered with slug "images"` and the form kept the old value.
