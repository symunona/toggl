
// import { createSignal, onMount } from "solid-js";
import { Component, createSignal, onMount } from "solid-js";
import { render } from "solid-js/web"
import { DateFormatter } from "./DateFormatter";


// function InvoiceList() {
//     return (
//         <div>
//             list
//         </div>
//     )
// }


// function App() {
//     return <div>
//         <header class="app">Invoice List</header>
//         <InvoiceList></InvoiceList>
//     </div>;
// }



type Invoice = {
    id: string
    date: Date
    clientKey: string
    from: Date
    to: Date
    client: Client
    company: string
    sumTimeMinutes: number
    sumNet: number
    sumGross: number
    sumNetChf: number
    sumGrossChf: number
    currency: string
    exchangeRate: number
    vat: number
};

type Client = {
    name: string
}

const firstYear = 2023;
const currentYear = new Date().getFullYear()

const years = Array.from({ length: currentYear - firstYear + 1 }, (_, i) => firstYear + i);

const App = () => {

    const [list, setList] = createSignal<Invoice[]>([]);
    const [year, setYear] = createSignal<number>(new Date().getFullYear());

    const getInvoicesOfYear = async (year) => {
        try {
            const response = await fetch(`cache/invoices-${year}.json`);
            const jsonData = await response.json();
            console.warn('data', jsonData)
            setList(jsonData);
        } catch (error) {
            console.error("Error fetching data: ", error);
            setList([]);
        }
    };

    onMount(() => {
        getInvoicesOfYear(year());
    });

    return (
        <div>
            <h1>Invoices</h1>
            {years.map((year)=>
                (<a href={'#' + String(year)} onClick={()=>{setYear(year); getInvoicesOfYear(year)}}>{year}</a>)
            )}
            <table>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>ClientKey</th>
                        <th>Date</th>
                        <th>From-To</th>
                        <th>details</th>
                        <th class="price">Net</th>
                    </tr>
                </thead>
                <tbody>
                    <InvoiceList list={list}></InvoiceList>
                </tbody>
            </table>
        </div>
    );
};

function InvoiceList({list}) {

    return <>
        {list().map((item, index) => {
            const prev = list()[index - 1]
            if (index > 0 && new Date(item.date).getMonth() != new Date(prev.date).getMonth()){
                return <>
                    <tr><td colSpan="5">{index.item.date.getMonth()}</td></tr>
                    <InvoiceItemRow item={item}/>
                    </>
            }
            else {
                return <InvoiceItemRow item={item}/>
            }
        })}
    </>
}

function InvoiceItemRow({item}){
    return (
        <tr>
            <td><Id item={item}/></td>
            <td>{item.clientKey}</td>
            <td><DateFormatter date={item.date} format="MM-DD"/></td>
            <td>
                <DateFormatter date={item.from} format="MM-DD"/> -&gt;
                <DateFormatter date={item.to} format="MM-DD"/> </td>
            <td></td>
            <td class="price">{item.sumNet}</td>
        </tr>)
}


function Id({item}){
    return new Date(item.date).getFullYear() + '-' +  String(item.id).padStart(5, '0')
}

/* @refresh reload */

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => <App />, root!);
