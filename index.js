import L from 'leaflet';

/**
 * @class L.TileLayer.Pixelated
 * @aka L.tileLayer.pixelated
 * @inherits L.TileLayer
 *
 * A Leaflet TileLayer that pixelates the map tiles.
 *
 * @example
 * L.tileLayer.pixelated('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
 * attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
 * }).addTo(map);
 */
L.TileLayer.Pixelated = L.TileLayer.extend({
    options: {
       /**
         * The pixelation factor. A higher number will result in a more pixelated image.
         * @type {Number}
         * @default 8
         */
        pixelationFactor: 8
    },

   createTile: function(coords, done) {
       const tile = document.createElement('img');
       tile.onload = () => {
           //Check if the tile needs to be pixelated
           if (tile.src === this.getTileUrl(coords)){
               this._pixelate(tile);
           }
           done(null, tile);
       };
       tile.onerror = function() {
           done(new Error('Tile not found'));
       };
       tile.onload = () => {
           // Check if the tile needs to be pixelated
           if (tile.src === this.getTileUrl(coords)){
               this._pixelate(tile);
           }
           done(null, tile);

       };
       tile.src = this._getPixelatedTileUrl(coords); // Use cached URL if available
       tile.crossOrigin = "Anonymous";
       return tile;
   },

    _getPixelatedTileUrl: function(coords) {
      const tileUrl = this.getTileUrl(coords);
      return (this._pixelatedTileCache && this._pixelatedTileCache[tileUrl]) || tileUrl;
    },

     // Modified _pixelate function with caching
     /**
     * @private
     * @param {HTMLImageElement} img The image element of the tile to pixelate.
     *
     * This function takes an image, draws a downscaled version to a canvas,
     * and then scales it back up with image smoothing disabled to create a
     * pixelated effect. The original image's src is then replaced with the
     * data URL of the pixelated canvas.
     */
    _pixelate: function(img) {
        if (!this._pixelationCanvas) {
            this._pixelationCanvas = document.createElement('canvas');
        }
        const canvas = this._pixelationCanvas;
        const ctx = canvas.getContext('2d',{ willReadFrequently: true });
        const width = img.width;

        const height = img.height;
        const pixelationFactor = this.options.pixelationFactor;

        canvas.width = width;
        canvas.height = height;

        // Turn off image smoothing to keep pixelated effect
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        // Draw the downscaled image
        ctx.drawImage(img, 0, 0, width / pixelationFactor, height / pixelationFactor);

        // Scale the small image back up to the original size
        ctx.drawImage(canvas, 0, 0, width / pixelationFactor, height / pixelationFactor, 0, 0, width, height);

        // Replace the original image source with the pixelated canvas
        const pixelatedUrl = canvas.toDataURL();
        // Cache the pixelated URL
        this._pixelatedTileCache[img.src] = pixelatedUrl; // Cache using original tile URL as key
        img.src = pixelatedUrl;
    },

    onAdd: function(map) {
       L.TileLayer.prototype.onAdd.call(this, map);
       // Initialize cache on layer addition
       this._pixelatedTileCache = {};
       this._pixelationCanvas = null; // Initialize canvas property
    }
});

L.tileLayer.pixelated = function(url, options) {
    return new L.TileLayer.Pixelated(url, options);
};