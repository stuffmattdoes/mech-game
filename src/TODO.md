# TODO

## Doing
* [ ] sharp (non-blurred) shadows
    * achieved by increasing the shadow map size to higher resolution
        ```jsx
            <directionalLight shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        ```
    * Fewer blur samples?

## To Do
* [ ] Outline shader
* [ ] Detail shader
* [ ] Pixel shader
    * [ ] disable anti-aliasing
* [ ] anti-aliasing
* [ ] checker texture tiling
* [ ] low-res screen-space color mapping

## Questions
* How does three JS render screen-space shaders?
* what are:
    * pass
    * shaderPass
    * renderPass
* [custom pass](https://github.com/pmndrs/postprocessing/wiki/Custom-Passes) vs. [custom effect](https://github.com/pmndrs/postprocessing/wiki/Custom-Effects#tldr)

## Done
