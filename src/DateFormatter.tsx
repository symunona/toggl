import { Component, Show } from "solid-js";


type DateFormatterProps = {
    date: Date | string;
    format: string;
};

const formatDate = (date: Date, format: string = 'YYYY-MM-DD HH:mm'): string => {
    const d = date instanceof Date ? date : new Date(date);
    const map = {
        'DD': ('0' + d.getDate()).slice(-2),
        'MM': ('0' + (d.getMonth() + 1)).slice(-2),
        'YYYY': d.getFullYear(),
        'HH': ('0' + d.getHours()).slice(-2),
        'mm': ('0' + d.getMinutes()).slice(-2),
        'ss': ('0' + d.getSeconds()).slice(-2)
    };
    return format.replace(/DD|MM|YYYY|HH|mm|ss/g, matched => map[matched]);
};

export const DateFormatter: Component<DateFormatterProps> = (props) => {
    return (
        <Show when={props.date} fallback={<span>Invalid date</span>}>
            <span>{formatDate(new Date(props.date), props.format)}</span>
        </Show>
    );
};
