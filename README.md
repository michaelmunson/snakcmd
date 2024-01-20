# SnakCMD

## Installation
`npm install snakcmd`

## Usage

### Creating Commands
```typescript
import SnakCMD from "snakcmd";

new SnakCMD()
    .command(['get', 'g'], (value, argMap) => {
        if (argMap.has('put'))
            console.log('Put Stuff!')
        console.log(`Get => ${value}`);
    })
    .command(['put'], value => {
        console.log(`Put => ${value}`);
    })
    .option('-m', value => {
        console.log(`Message -> ${value}`); 
    })
    .option(['-a', '--add'], value => {
        console.log(`Add -> ${value}`)
    })

    .run(process.argv.slice(2), argvMap => {
        return 0;
    });
```
`cmd get fish -a -m "its cooked"`
```
Get => fish
-a => null
-m => its cooked
```
`cmd get goose put cats`
```
Put stuff!
Get => fish
Put => cats
```
`cmd -am "some message"`
```
-a => null
-m => some message
```

### Async Commands
* for asynchronous logic, return a promise 
```typescript
import SnakCMD from "snakcmd"

new SnakCMD()
    .command('wait', value => {
        const delay = (value) ? parseInt(value) : 5;
        return new Promise(resolve => setTimeout(resolve, delay*1000));
    })
    .command('log', value => {
        console.log(value);
    })
    .run(process.argv.slice(2));

```
`cmd wait 2 log "log after waiting 2 seconds"`
