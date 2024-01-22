import { Component, Show } from "solid-js";

const CURRENCY_FORMATTER = {
    "huf": 0,
    "chf": 2,
    "usd": 2,
    "eur": 2
}


const formatCurrency = (currency: string, value: number): string => {
    const numbersAfterDot = CURRENCY_FORMATTER[currency] || 2
    const roundToConstMultiplier = Math.pow(10, numbersAfterDot)
    const roundedValue = Math.round(value * roundToConstMultiplier) / roundToConstMultiplier

    let formattedCurrency = String(roundedValue)
    if (formattedCurrency.indexOf('.') === -1 && numbersAfterDot > 0){
        formattedCurrency += '.' + ('0'.repeat(numbersAfterDot))
    } else {
        const l = formattedCurrency.length
        const i = formattedCurrency.lastIndexOf('.')
        const missingZerosAfterTheEnd = l - i - 1 - numbersAfterDot
        if (missingZerosAfterTheEnd > 0){
            formattedCurrency += + ('0'.repeat(missingZerosAfterTheEnd))
        }
    }

    return formattedCurrency
};

export const CurrencyFormatter: Component<{currency: string, value: number}> = (props) => {
    return (
        <Show when={props.value} fallback={<span>Invalid date</span>}>
            <span>{formatCurrency(props.currency, props.value)}</span>
        </Show>
    );
};
