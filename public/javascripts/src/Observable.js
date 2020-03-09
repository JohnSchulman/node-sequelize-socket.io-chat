// permet d'executer d'un bout de code dans le cadre d'un changmeent de propriété
class Observable {
    // getter test si elle existe et sinon return null
    get(prop) {
        return this[`_${prop}`] !== undefined ? this[`_${prop}`] : null;
    }
    // prop c'est le nom de la propriété cad i.e onchanged et value c'est _old (ancien valeur) et _new (le nouveau)
    set(prop, value) {
        let old = this[`_${prop}`];
        if(typeof old === 'object') {
            if (old.length !== value.length) {
                // concanctenation pour le nom de ma fonction onchanged
                this[`on${prop.substr(0, 1).toUpperCase()}${prop.substr(1, prop.length - 1).toLowerCase()}Change`](old, value);
                // la nouvelle valeur
                this[`_${prop}`] = value;
                //let valeur = this._test;
            }
        } else {
            // comme ici on compare des type objets on doit mettre une deuxième condition
            if (old !== value) {
                this[`on${prop.substr(0, 1).toUpperCase()}${prop.substr(1, prop.length - 1).toLowerCase()}Change`](old, value);
                this[`_${prop}`] = value;
            }
        }
    }
}
