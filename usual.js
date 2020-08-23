const configurations = {
    leaderUrl : '',
    minPLank : 3,
    searchKey: 'name',
    postUrl : 'https://jsonplaceholder.typicode.com',
    urlList : ['cars.json', 'countries.json', 'mix.json']
}

const search    = document.getElementById('search');
const matchList = document.getElementById('match-list-search');



//записать значение в localStorage и отправить POST
const setLocalItem = async (postUrl) => {

    const input = document.getElementById('search');
    const ul = document.getElementById('match-list-search');
    const autosuggestList = [];

    const value = input.value;

    if (!value) {
        return true
    }

    document.getElementById('match-list-search').childNodes.forEach(item => {
        autosuggestList.push(item.textContent);
    })
    const filteredAutosuggestList = autosuggestList.filter(item => item === value);

    if (!filteredAutosuggestList.length) {

        if (localStorage.getItem(`search-${configurations.searchKey}`)) {
            const localArr = JSON.parse( localStorage.getItem(`search-${configurations.searchKey}`) );
            if (!localArr.some(item => item === value)) {
                localArr.push(value);
                localStorage.setItem(`search-${configurations.searchKey}`, JSON.stringify(localArr));
            }
        } else {
            localStorage.setItem(`search-${configurations.searchKey}`, JSON.stringify([value]));
        }
    }
        // комментирую, так как нет места, куда могу отправлять post
    // fetch(postUrl, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json;charset=utf-8'
    //     },
    //     body: JSON.stringify(value)
    //   })

      let canCreateItemList = true;

      for (let i = 0; i < ul.children.length; i++) {
          const element = ul.children[i];
          if (ul.children[i].textContent === value) {
            canCreateItemList = false
            break
          }
      }

      if (canCreateItemList) {
        ul.append(renderDropDownItem(value, true))
      }
}


//удалить из localstorage значение если оно там есть и отчистить форму
const deleteLocalItemClearForm = () => {
    const searchInput = document.getElementById('search');
    if (!searchInput.value) {
        return true
    }
    if (localStorage.getItem(`search-${configurations.searchKey}`)) {
        const localMatches = JSON.parse( localStorage.getItem(`search-${configurations.searchKey}`) );
        const indexStoragePossibleAnswer = localMatches.indexOf(searchInput.value)

        const ulChildren = document.querySelectorAll('.inputs-test__match-list > li')
        for (let i = 0; i < ulChildren.length; i++) {
            if (ulChildren[i].textContent === searchInput.value) {
                ulChildren[i].remove()
                break
            }
        }
        if (indexStoragePossibleAnswer !== -1) {
            localMatches.splice(indexStoragePossibleAnswer, 1)
            localStorage.setItem(`search-${configurations.searchKey}`, JSON.stringify( localMatches ))
        } 
    }
    searchInput.value = '';
}

//найти значение ключа в объекте любой вложенности 
const findValue = (object, key) => {
    let value;
    Object.keys(object).some((k) => {
        if (k === key) {
            value = object[k];
            return true;
        }
        if (object[k] && typeof object[k] === 'object') {
            value = findValue(object[k], key);
            return value !== undefined;
        }
    });
    return value;
}

//получить список совпадений
const getList = async(key, searchText, url) => {
    let totalData = {
        filtered : [],
        localFiltered: []
    }
    const states   = await fetch(url).then(data => data.json());
    const filtered = states.map(item => findValue(item, key))

     totalData.filtered = filtered.filter(item => {
        const regex = new RegExp(`^${searchText}`, 'gi');
        return item.match(regex)
    })

    const localStates = [];

    JSON.parse(localStorage.getItem(`search-${configurations.searchKey}`)).forEach(item => localStates.push(item))

    totalData.localFiltered = localStates.filter(item => {
        const regex = new RegExp(`^${searchText}`, 'gi');
        return item.match(regex)
    })

    return totalData
}


//искать совпадения по первой введенной букве
const searchStatesFirstLetter = async(key, searchText, minPLank,  arr) => {
    let totalList = [];
    if (searchText.length === 1) {
        totalList = await firstSearch(key, searchText,  arr);

    } else if (searchText.length > 1) {
        totalList = await getList(key, searchText, configurations.leaderUrl)
    }

    if (searchText.length === 0 || undefined) {
        configurations.leaderUrl           = '';
        totalList           = [];
        matchList.innerHTML = '';
    }
    renderDropDownList(totalList.filtered || [], totalList.localFiltered || [])
}

//поиск среди массива url , чтоб установить тот, который первый выдаст необходимый минимум подходящих элементов
//или дойдет до последнего
const firstSearch = async(key, searchText, arr) => {
    let total = [];
    for (let i = 0; i < arr.length; i++) {
        total = await getList(key, searchText, arr[i]);
        if (total.filtered.length >= configurations.minPLank) {
            configurations.leaderUrl = arr[i];
            break
        } else {
            configurations.leaderUrl = arr[i];
        }
    }
    return total;
}

//скрыть список, если нет детей / показать, если есть
const myObserverForChild = () => {
    const ul = document.getElementById('match-list-search')
        if (ul.children.length === 0) {
            ul.classList.add('disabled')
        } else {
            ul.classList.remove('disabled')
        }    
}

//активировать слежку на обновлениями изменения количества детей у списка
const activateMyObserverForChild = () => {
    let target   = document.getElementById('match-list-search');
    let observer = new MutationObserver(() => {
        myObserverForChild()
    })
    observer.observe(target, {childList: true, subtree: true})
}


//клик по элементу списка совпадений
const DropDownItemSetInput = (word) => {
    search.value = word
    const ul     = document.getElementById('match-list-search');
    ul.innerHTML = ''
}

//рендер элемента списка совпадений
const renderDropDownItem = (item, isLocal) => {
    const li       = document.createElement('LI');
    li.textContent = item;
    if (isLocal) {
        li.className   = 'inputs-test__match-item inputs-test__match-item--local';
    } else {
        li.className   = 'inputs-test__match-item';
    }
    
    li.addEventListener('click', () => DropDownItemSetInput(item))
    return li
}

//рендер выпадающего списка
const renderDropDownList = (matches, localMatches) => {
    const ul     = document.getElementById('match-list-search');
    ul.innerHTML = "";
    ul.ulLocal = "";
    if (matches.length > 0 || undefined) {
        matches.forEach((item, index) => {
            ul.append(renderDropDownItem(item, false))
        })
    }

    if (localMatches.length > 0 || undefined) {
        localMatches.forEach((item, index) => {
            ul.append(renderDropDownItem(item, true))
        })
    }
}



const checkLocalStorage = () => {
    if (!localStorage.getItem(`search-${configurations.searchKey}`)) {
        localStorage.setItem(`search-${configurations.searchKey}`, '[]')
    }
}




document.addEventListener("DOMContentLoaded", () => {
    search.addEventListener('input', () => searchStatesFirstLetter(configurations.searchKey, search.value, 3 , configurations.urlList))
    document.getElementById('input__btn--clear-search').addEventListener('click', deleteLocalItemClearForm)
    document.querySelector('.input__btn--rec-search').addEventListener('click', () => setLocalItem(configurations.postUrl))
    activateMyObserverForChild()
    checkLocalStorage()
});









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


