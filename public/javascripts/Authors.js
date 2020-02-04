class Authors extends Observable {
    _authors = [];

    onAuthorsChange(_old, _new) {
        let authors = '';
        if(_new.length === 1 || _new.length === 2)
            authors = _new[0] + (_new.length === 2 ? ' et ' + _new[1] : '');
        else if(_new.length > 2)
            authors = _new[0] + ', ' + _new[1] + ', etc';
        document.querySelector('.is_writing').innerHTML = authors === '' ? '' : authors + ' ' + (_new.length >= 2 ? 'sont' : 'est') + ' en train d\'écrire ...';
    }
}