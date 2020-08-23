const configurationSearch = {
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
    const list = document.getElementById('match-list-search');
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

        if (localStorage.getItem(`search-${configurationSearch.searchKey}`)) {
            const localArr = JSON.parse( localStorage.getItem(`search-${configurationSearch.searchKey}`) );
            if (!localArr.some(item => item === value)) {
                localArr.push(value);
                localStorage.setItem(`search-${configurationSearch.searchKey}`, JSON.stringify(localArr));
            }
        } else {
            localStorage.setItem(`search-${configurationSearch.searchKey}`, JSON.stringify([value]));
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

      for (let i = 0; i < list.children.length; i++) {
          if (list.children[i].textContent === value) {
            canCreateItemList = false
            break
          }
      }

      if (canCreateItemList) {
        list.append(renderDropDownItem(value, true))
      }
}


//удалить из localstorage значение если оно там есть и отчистить форму
const deleteLocalItemClearForm = () => {
    const searchInput = document.getElementById('search');
    if (!searchInput.value) {
        return true
    }
    if (localStorage.getItem(`search-${configurationSearch.searchKey}`)) {
        const localMatches = JSON.parse( localStorage.getItem(`search-${configurationSearch.searchKey}`) );
        const indexStoragePossibleAnswer = localMatches.indexOf(searchInput.value)

        const list = document.getElementById('match-list-search');
        for (let i = 0; i < list.children.length; i++) {
            if (list.children[i].textContent === searchInput.value) {
                list.children[i].remove()
                break
            }
        }
        if (indexStoragePossibleAnswer !== -1) {
            localMatches.splice(indexStoragePossibleAnswer, 1)
            localStorage.setItem(`search-${configurationSearch.searchKey}`, JSON.stringify( localMatches ))
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

    JSON.parse(localStorage.getItem(`search-${configurationSearch.searchKey}`)).forEach(item => localStates.push(item))

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
        totalList = await getList(key, searchText, configurationSearch.leaderUrl)
    }

    if (searchText.length === 0 || undefined) {
        configurationSearch.leaderUrl           = '';
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
        if (total.filtered.length >= configurationSearch.minPLank) {
            configurationSearch.leaderUrl = arr[i];
            break
        } else {
            configurationSearch.leaderUrl = arr[i];
        }
    }
    return total;
}

//скрыть список, если нет детей / показать, если есть
const myObserverForChild = () => {
    const list = document.getElementById('match-list-search')
        if (list.children.length === 0) {
            list.classList.add('disabled')
        } else {
            list.classList.remove('disabled')
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
    const list     = document.getElementById('match-list-search');
    list.innerHTML = ''
}

//рендер элемента списка совпадений
const renderDropDownItem = (item, isLocal) => {
    const itemList       = document.createElement('DIV');
    itemList.textContent = item;
    if (isLocal) {
        itemList.className   = 'inputs-test__match-item inputs-test__match-item--local';
    } else {
        itemList.className   = 'inputs-test__match-item';
    }

    itemList.addEventListener('click', () => DropDownItemSetInput(item))
    return itemList
}

//рендер выпадающего списка
const renderDropDownList = (matches, localMatches) => {
    const list     = document.getElementById('match-list-search');
    list.innerHTML = "";
    list.ulLocal = "";
    if (matches.length > 0 || undefined) {
        matches.forEach(item => {
            list.append(renderDropDownItem(item, false))
        })
    }

    if (localMatches.length > 0 || undefined) {
        localMatches.forEach(item => {
            list.append(renderDropDownItem(item, true))
        })
    }
}



const checkLocalStorage = () => {
    if (!localStorage.getItem(`search-${configurationSearch.searchKey}`)) {
        localStorage.setItem(`search-${configurationSearch.searchKey}`, '[]')
    }
}




document.addEventListener("DOMContentLoaded", () => {
    search.addEventListener('input', () => searchStatesFirstLetter(configurationSearch.searchKey, search.value, 3 , configurationSearch.urlList))
    document.getElementById('input__btn--clear-search').addEventListener('click', deleteLocalItemClearForm)
    document.querySelector('.input__btn--rec-search').addEventListener('click', () => setLocalItem(configurationSearch.postUrl))
    activateMyObserverForChild()
    checkLocalStorage()
});










