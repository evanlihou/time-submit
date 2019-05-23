/**
 * @file A helper to allow short-term caching of data
 */

/** A short lived cache
 *  @template TDataType 
*/
export default class Cache {
    /**
     * Data held in the cache. Access using get() and set()
     * @type {TDataType}
     * @private
     */
    _data = null;
    /**
     * Are we loading in data?
     * @type {boolean}
     */
    loading = false;
    /**
     * A list of callbacks when we have data ready. Read-only, access using addCallback().
     * Cleared when cache is reset.
     * @type {cacheCallback[]}
     * @private
     */
    callbacks = [];

    /**
     * Set the value and notify people interested
     * @param {TDataType} v
     */
    set data(v) {
        this._data = v;
        this.loading = false;
        this.callbacks.forEach(c => c(v));
        // Reset after a bit to prevent stale data
        setTimeout(this.reset.bind(this), 2 * 1000);
    }

    get data() {
        var tmp = this._data;
        // If we're returning an object, add a note that this was cached
        if (typeof tmp === 'object' && tmp !== null) tmp.isCached = true;
        return tmp;
    }

    /**
     * Adds a function to call back with data when it gets set
     * @param {cacheCallback} c 
     */
    addCallback(c) {
        this.callbacks.push(c);
    }

    /**
     * Reset the cache
     */
    reset() {
        this._data = null;
        this.loading = false;
        this.callbacks = [];
    }

    /**
     * @callback cacheCallback
     * @param {string} data
     */
}