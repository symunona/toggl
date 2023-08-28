# toggl console weekly hours retriever

Are you using Toggl?
Want to have a simple plain-text report of your weekly hours?

This script is for you.

## Usage

Install:

`npm i`

Run

`node toggl-pull.js`

or

`node toggl-pull.js 1` <- number of weeks backwards


For the output:

```
---<LOG retirever>---


Week 34: 2023-08-19 -> 2023-08-25


My First Project
----------------
Week 34: 2023-08-19 -> 2023-08-25
_____________________________________________
03:38   Bughunt
02:48   Optimize something
00:58   More reporting
00:37   Writing this text
_____________________________________________
08:03   Week 34 SUM


My Other Project
----------------
Week 34: 2023-08-19 -> 2023-08-25
_____________________________________________
00:58   Sending mails to accountant
01:37   Nerve wracking
_____________________________________________
02:35   Week 34 SUM
```
