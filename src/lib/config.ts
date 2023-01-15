export type Option = string | object | number | undefined;

export interface Config {
    url : Option,
    query : Option,
    headers : Option
};

const ARGV = process.argv;
var CONFIG : Config = getConfig(ARGV);

export function throwError(error : string) : void {

    console.log(error);
    process.exit();

};

function getOptionValue(argv : string[], option : string) : Option {

    let index : number = argv.indexOf(option);

    if(index == -1) return;
    else if(index >= argv.length) throwError("Missing value for " + option + " option!");
    else return argv[index + 1];

    return;

};

function getHeaders(argv : string[]) : object {

    let headers : object = {};
    let index : number = argv.indexOf("-h");

    while(index !== -1 && (index + 1) < argv.length){

        let header : string[] = argv[index + 1].split(":");
        if(header.length == 1) throwError("Bad header " + argv[index + 1])

        let key : string = header[0].trim();
        let value : string = header[1].trim();

        headers[key] = value;

        argv = argv.slice(index + 2, argv.length);
        index = argv.indexOf("-h");

    };

    return headers;

};

function getConfig(argv : string[]) : Config {

    let config : Config = {
        url : getOptionValue(argv, "-u"),
        query : getOptionValue(argv, "-q"),
        headers : getHeaders(argv)
    };

    if(!config.url) throwError("Required option -u!"); 

    //console.log(config.headers);

    return config;
};

export { CONFIG };

