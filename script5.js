// my const variables
const newCurrency = document.getElementById('currency-one');
const dropdown = document.querySelector('.select2-dropdown');
const list = document.querySelector('.currency-list');
const inputValue = document.querySelector('.input-value');
const currencyValue = document.querySelector('.currency-value');


// api function
const API_KEY = '1167fafaa345f681cefe3763'

const getRates = async (cur) => {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${cur}`)
    const data = await response.json()
    return data.conversion_rates
}

// Save currencies to local storage
const saveCurrenciesToLocalStorage = () => {
    const currencyDivs = list.querySelectorAll('.currency-div');
    const currenciesData = [];
    
    currencyDivs.forEach(div => {
        const currencyCode = div.querySelector('.land-name').textContent;
        const currencyValue = parseFloat(div.querySelector('.currency-value').textContent);
        
        currenciesData.push({
            code: currencyCode,
            value: currencyValue
        });
    });
    
    localStorage.setItem('currencyConverter', JSON.stringify(currenciesData));
}

// Load currencies from local storage
const loadCurrenciesFromLocalStorage = async () => {
    const savedData = localStorage.getItem('currencyConverter');
    
    if (savedData) {
        const currenciesData = JSON.parse(savedData);
        
        // Clear existing currencies first
        list.innerHTML = '';
        
        // If we have saved currencies, use the first one as base
        if (currenciesData.length > 0) {
            const baseData = currenciesData[0];
            
            // Add all currencies from saved data
            for (const currency of currenciesData) {
                await newDiv(currency.code, baseData.code, baseData.value);
            }
            
            return true; // Successfully loaded
        }
    }
    
    return false; // Nothing loaded, use defaults
}

// Helper function to trigger save after updates
const updateAndSave = () => {
    // Add a small delay to ensure values are updated before saving
    setTimeout(() => {
        saveCurrenciesToLocalStorage();
    }, 100);
}

// Function to update all currency values based on the selected base currency
const updateAllCurrencyValues = async (baseCurrency, baseAmount = 1) => {
    // Get rates for the selected base currency
    const rates = await getRates(baseCurrency);
    
    // Get all currency divs
    const currencyDivs = list.querySelectorAll('.currency-div');
    
    // Update each currency div with the new rates
    currencyDivs.forEach(div => {
        // Get the currency code from this div
        const currencyCode = div.querySelector('.land-name').textContent;
        
        // If this is the base currency, set value to the base amount
        if (currencyCode === baseCurrency) {
            div.querySelector('.currency-value').textContent = baseAmount.toFixed(2);
        } 
        // Otherwise calculate the rate
        else if (rates[currencyCode]) {
            const convertedValue = baseAmount * rates[currencyCode];
            div.querySelector('.currency-value').textContent = convertedValue.toFixed(2);
        }
    });
    
    // Save to local storage after updating
    updateAndSave();
}

// Function to add a new div with everything in it
const newDiv = async (curCode, baseCurrency = 'EUR', baseAmount = 1) => {
    const currencyDivs = list.querySelectorAll('.currency-div');
    if (currencyDivs.length < 8) {
        // Get rates for the base currency if needed
        let convertedValue = 1.00;
        
        if (baseCurrency !== curCode) {
            const rates = await getRates(baseCurrency);
            if (rates && rates[curCode]) {
                convertedValue = baseAmount * rates[curCode];
            }
        }
        
        const div = document.createElement('div');
        div.className = 'currency-div';
        div.innerHTML = `<div class="front">
                            <p class="flags">${flag(curCode)}</p>
                            <span class="land-name">${curCode}</span>
                        </div>
                        <div class="back">
                            <p class="symbols">${symbol(curCode)}</p>
                            <span class="currency-value">${convertedValue.toFixed(2)}</span>
                            <input class="input-value" type="text" style="display: none;">
                            <img class="cross" src="img/cross.svg" alt="">
                        </div>`;
        list.appendChild(div);
        
        // Save to local storage after adding
        updateAndSave();
    }
};

// function that gets the currency rates
const currencyRates = (curCode) => {
    const rates = getRates(curCode)
    if (rates.filter(curCode)) {
        return rates
    }
}

// Function to get flag for a currency code
const flag = (currencyCode) => {
    if (currency_flags_and_symbols[currencyCode]) {
        return currency_flags_and_symbols[currencyCode][0]; // Return the flag (first element)
    }
    return null; // Return null if currency code not found
};

// Function to get symbol for a currency code
const symbol = (currencyCode) => {
    if (currency_flags_and_symbols[currencyCode]) {
        return currency_flags_and_symbols[currencyCode][1]; // Return the symbol (second element)
    }
    return null; // Return null if currency code not found
};

// jquery event listener
$('#currency-one').on('select2:select', async function (e) {
    const selectedCurrency = $(this).val();
    
    // Get current base currency and amount if any exist
    let baseCurrency = 'EUR';
    let baseAmount = 1;
    
    const existingDivs = list.querySelectorAll('.currency-div');
    if (existingDivs.length > 0) {
        // Use the first div's currency as the base
        const firstDiv = existingDivs[0];
        baseCurrency = firstDiv.querySelector('.land-name').textContent;
        baseAmount = parseFloat(firstDiv.querySelector('.currency-value').textContent);
    }
    
    // Add the new currency div
    await newDiv(selectedCurrency, baseCurrency, baseAmount);
    
    // Reset the Select2 dropdown to show the placeholder again
    $(this).val(null).trigger('change');
});

list.addEventListener('click', (event) => {
    // Case 1: Handle cross button clicks
    if (event.target.classList.contains('cross')) {
        // Get all currency-div elements
        const currencyDivs = list.querySelectorAll('.currency-div');

        // Only allow removal if there are at least 3 divs
        if (currencyDivs.length >= 3) {
            // Remove the currency-div (parent's parent of the cross)
            event.target.parentElement.parentElement.remove();
            
            // Save to local storage after removing
            updateAndSave();
        } 
    }
    
    // Case 2: Handle currency value clicks
    if (event.target.classList.contains('currency-value')) {
        // Hide the currency value
        event.target.style.display = 'none';
        
        // Find and show the input in the same parent div
        const inputValue = event.target.parentElement.querySelector('.input-value');
        if (inputValue) {
            inputValue.style.display = 'block';
        }
    }
});

// Add this to your list event listener
list.addEventListener('keyup', (event) => {
    // Check if an input value element triggered the event
    if (event.target.classList.contains('input-value') && event.key === 'Enter') {
        const newValue = parseFloat(event.target.value);
        
        // If the input is a valid number
        if (!isNaN(newValue)) {
            // Hide the input
            event.target.style.display = 'none';
            
            // Get the currency code for this div
            const currencyDiv = event.target.closest('.currency-div');
            const currencyCode = currencyDiv.querySelector('.land-name').textContent;
            
            // Find and show the corresponding currency value
            const currencyValue = event.target.parentElement.querySelector('.currency-value');
            if (currencyValue) {
                currencyValue.textContent = newValue.toFixed(2);
                currencyValue.style.display = 'block';
            }
            
            // Update all other currency values based on this new base amount and currency
            updateAllCurrencyValues(currencyCode, newValue)
                .then(() => {
                    // Save to local storage after updating all values
                    updateAndSave();
                });
        }
    }
});

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function () {
    // Try to load from local storage first
    const loaded = await loadCurrenciesFromLocalStorage();
    
    // If nothing was loaded, initialize with defaults
    if (!loaded) {
        await newDiv('EUR');
        await newDiv('USD');
        await newDiv('BRL');
    }
    
    // Check if jQuery and Select2 are loaded
    if (window.jQuery && jQuery.fn.select2) {
        // Initialize Select2 with minimal configuration
        $('#currency-one').select2({
            placeholder: 'Select Currency',
            width: '50%',
        });
    }
});

// Currency flags and symbols object
const currency_flags_and_symbols = {
    USD: ['🇺🇸', '$'], // United States Dollar
    EUR: ['🇪🇺', '€'], // Euro
    JPY: ['🇯🇵', '¥'], // Japanese Yen
    GBP: ['🇬🇧', '£'], // British Pound
    AUD: ['🇦🇺', '$'], // Australian Dollar
    CAD: ['🇨🇦', '$'], // Canadian Dollar
    CHF: ['🇨🇭', 'CHF'], // Swiss Franc
    CNY: ['🇨🇳', '¥'], // Chinese Yuan
    HKD: ['🇭🇰', '$'], // Hong Kong Dollar
    NZD: ['🇳🇿', '$'], // New Zealand Dollar
    SEK: ['🇸🇪', 'kr'], // Swedish Krona
    KRW: ['🇰🇷', '₩'], // South Korean Won
    SGD: ['🇸🇬', '$'], // Singapore Dollar
    NOK: ['🇳🇴', 'kr'], // Norwegian Krone
    MXN: ['🇲🇽', '$'], // Mexican Peso
    INR: ['🇮🇳', '₹'], // Indian Rupee
    RUB: ['🇷🇺', '₽'], // Russian Ruble
    ZAR: ['🇿🇦', 'R'], // South African Rand
    TRY: ['🇹🇷', '₺'], // Turkish Lira
    BRL: ['🇧🇷', 'R$'], // Brazilian Real
    TWD: ['🇹🇼', 'NT$'], // New Taiwan Dollar
    DKK: ['🇩🇰', 'kr'], // Danish Krone
    PLN: ['🇵🇱', 'zł'], // Polish Zloty
    THB: ['🇹🇭', '฿'], // Thai Baht
    IDR: ['🇮🇩', 'Rp'], // Indonesian Rupiah
    HUF: ['🇭🇺', 'Ft'], // Hungarian Forint
    CZK: ['🇨🇿', 'Kč'], // Czech Koruna
    ILS: ['🇮🇱', '₪'], // Israeli New Shekel
    CLP: ['🇨🇱', '$'], // Chilean Peso
    PHP: ['🇵🇭', '₱'], // Philippine Peso
    AED: ['🇦🇪', 'AED'], // UAE Dirham
    COP: ['🇨🇴', '$'], // Colombian Peso
    SAR: ['🇸🇦', 'SAR'], // Saudi Riyal
    MYR: ['🇲🇾', 'RM'], // Malaysian Ringgit
    RON: ['🇷🇴', 'lei'], // Romanian Leu
    UAH: ['🇺🇦', '₴'], // Ukrainian Hryvnia
    VND: ['🇻🇳', '₫'], // Vietnamese Dong
    BGN: ['🇧🇬', 'лв'], // Bulgarian Lev
    PEN: ['🇵🇪', 'S/.'], // Peruvian Sol
    PKR: ['🇵🇰', 'Rs'], // Pakistani Rupee
    EGP: ['🇪🇬', 'EGP'], // Egyptian Pound
    NGN: ['🇳🇬', '₦'], // Nigerian Naira
    BDT: ['🇧🇩', '৳'], // Bangladeshi Taka
    ARS: ['🇦🇷', '$'], // Argentine Peso
    MAD: ['🇲🇦', 'MAD'], // Moroccan Dirham
    KZT: ['🇰🇿', '₸'], // Kazakhstani Tenge
    KES: ['🇰🇪', 'Ksh'], // Kenyan Shilling
    LKR: ['🇱🇰', 'Rs'], // Sri Lankan Rupee
    DZD: ['🇩🇿', 'DZD'], // Algerian Dinar
    OMR: ['🇴🇲', 'OMR'], // Omani Rial
    QAR: ['🇶🇦', 'QR'], // Qatari Rial
    IQD: ['🇮🇶', 'IQD'], // Iraqi Dinar
    KWD: ['🇰🇼', 'KWD'], // Kuwaiti Dinar
    JOD: ['🇯🇴', 'JOD'], // Jordanian Dinar
    BHD: ['🇧🇭', 'BHD'], // Bahraini Dinar
    LYD: ['🇱🇾', 'LYD'], // Libyan Dinar
    TND: ['🇹🇳', 'TND'], // Tunisian Dinar
};
