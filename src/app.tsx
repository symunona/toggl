
// import { createSignal, onMount } from "solid-js";
import { Show, createEffect, createSignal, onMount } from "solid-js";
import { render } from "solid-js/web"
import { DateFormatter } from "./DateFormatter";
import { CurrencyFormatter } from "./CurrencyFormatter";


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

const monthNames = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];


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
    fileNameRoot: string
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
    const [currentInvoice, setCurrentInvoice] = createSignal<Invoice|null>();

    const getInvoicesOfYear = async (year) => {
        setCurrentInvoice(null)
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

    let iframeRef;


    onMount(() => {
        getInvoicesOfYear(year());
    });


    createEffect(()=>{
        console.warn(currentInvoice())
    })

    return (
        <div>
            <h1>Invoices</h1>
            {years.map((year)=>
                <>
                    <a href={'#' + String(year)} onClick={()=>{setYear(year); getInvoicesOfYear(year)}}>{year}</a>
                    <span> </span>
                </>
            )}
            <table>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>ClientKey</th>
                        <th>Date</th>
                        <th>W</th>
                        <th>From-To</th>
                        <th>details</th>
                        <th>fn</th>
                        <th class="price">Net (CHF)</th>
                    </tr>
                </thead>
                <tbody>
                    <InvoiceList list={list}
                        currentInvoice={currentInvoice}
                        setCurrentInvoice={setCurrentInvoice}
                        ></InvoiceList>
                </tbody>
            </table>
            <hr/>
            <Show when={Boolean(currentInvoice())}>
                <iframe ref={iframeRef} src={`invoices/${currentInvoice().fileNameRoot}.pdf`} onLoad={()=>{
                    console.warn('what is this?', this, iframeRef)
                    const doc = iframeRef.contentDocument as Document
                    doc.body.style.padding = '50px'
                    doc.body.style.width = '900px'
                    doc.body.style.overflow = 'hidden'
                    doc.body.style.height = '1000px'

                }}></iframe>
            </Show>
        </div>
    );
};

function InvoiceList({list, currentInvoice, setCurrentInvoice}) {
    let lastSum = 0
    return <>
        {list().map((item, index) => {
            if (index === 0) lastSum = 0
            const prev = list()[index - 1]
            lastSum += item.sumNetChf
            if (index > 0 && new Date(item.date).getMonth() != new Date(prev.date).getMonth()){
                const ret = <>
                    <tr><td colSpan="8"><strong>{lastSum}</strong></td></tr>
                    <tr><td colSpan="8">{index.item.date.getMonth()}</td></tr>
                    <InvoiceItemRow item={item} currentInvoice={currentInvoice} setCurrentInvoice={setCurrentInvoice}/>
                    </>
                return ret
            }
            else if (index === list().length - 1){
                return <>
                <InvoiceItemRow item={item} currentInvoice={currentInvoice} setCurrentInvoice={setCurrentInvoice}/>
                <tr class="monthly-sum">
                    <td colSpan="7"><strong>{monthNames[new Date(item.date).getMonth()]}</strong></td>
                    <td class="price"><strong>{<CurrencyFormatter value={lastSum} currency='chf'/>}</strong></td>
                </tr>
                </>
            }
            return <InvoiceItemRow item={item} currentInvoice={currentInvoice} setCurrentInvoice={setCurrentInvoice}/>
        })}
    </>
}

function InvoiceItemRow({item, currentInvoice, setCurrentInvoice}){
    return (
        <tr onClick={()=>{
                console.warn(item)
                setCurrentInvoice(item)
            }} classList={{current: item === currentInvoice()}}>
            <td><Id item={item}/></td>
            <td>{item.clientKey}</td>
            <td><DateFormatter date={item.date} format="MM-DD"/></td>
            <td>{item.week || ''}</td>
            <td>
                <DateFormatter date={item.from} format="MM-DD"/> -&gt;
                <DateFormatter date={item.to} format="MM-DD"/> </td>
            <td>{item.fileNameRoot}</td>
            <td></td>
            <td class="price">{item.sumNetChf}</td>
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
