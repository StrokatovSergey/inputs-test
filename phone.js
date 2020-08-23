const configurationPhone = {
    caretPosition: 2,
    pattern : "+*(***) ***-****",
    mask : "+7(###) ###-####"
}


//создать маску
const doFormatPhone = (x, pattern, mask) => {
    let strippedValue = x.replace(/[^0-9]/g, "");
    let chars     = strippedValue.split('');
    let count     = 0;
    let formatted = '';
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i];
        if (chars[count]) {
            if (/\*/.test(c)) {
                formatted += chars[count];
                count++;
            } else {
                formatted += c;
            }
        } else if (mask) {
            if (mask.split('')[i])
                formatted += mask.split('')[i];
        }
    }
    return formatted;
}

//установить маску в инпут
const formatPhone = (elem) => {
    let val    = doFormatPhone(elem.value, configurationPhone.pattern);
    elem.value = doFormatPhone(elem.value, configurationPhone.pattern , configurationPhone.mask);

    if (elem.createTextRange) {
        let range = elem.createTextRange();
        range.move('character', val.length);
        range.select();
    } else if (elem.selectionStart) {
        elem.focus();
        elem.setSelectionRange(val.length, val.length);
    }
}

const phone     = document.getElementById('phone');


phone.onfocus = () => {
    setTimeout(() => {
        phone.selectionStart = phone.selectionEnd = configurationPhone.caretPosition;
    });
};



phone.addEventListener('keyup', () => formatPhone(phone));
formatPhone(phone)



