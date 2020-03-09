class Authors extends Observable {
    constructor() {
        super();
        // propriété virutel
        this._authors = [];
    }

    // ma fonction qui se lance des la proprété virutelle change
    onAuthorsChange(_old, _new) {
        let authors = '';
        if(_new.length === 1 || _new.length === 2)
            authors = _new[0] + (_new.length === 2 ? ' et ' + _new[1] : '');
        else if(_new.length > 2)
            authors = _new[0] + ', ' + _new[1] + ', etc';
        if(authors !== '') {
            document.querySelector('.notification-toast').MaterialSnackbar.showSnackbar({
                message: authors === '' ? '' : authors + ' ' + (_new.length >= 2 ? 'sont' : 'est') + ' en train d\'écrire ...'
            });
        }
    }
}
