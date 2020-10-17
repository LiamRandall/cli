/// <reference types="node" />
export declare function load(endpoint: string): Promise<Buffer>;
export declare function checkPrerequisites(): Promise<void>;
export declare function install(location: string): Promise<void>;
