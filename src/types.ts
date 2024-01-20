
export type ExitCode = number;

export type Optional<T> = {
    [P in keyof T]?: T[P]
}

export type Config = {
    helpMessage?: string
    argvConvert: boolean
    splitComboOpts: boolean
    onUnrecognized: (arg:string) => void
}

export type CommandOptionConfig = {
    description: string
}
