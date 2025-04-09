export declare function setupPyYouwolBackend({ localOnly, port, }: {
    localOnly: boolean;
    port: number;
}): void;
/**
 *
 * @param packages paths of 'cdn.zip' files from 'tests' directory
 */
export declare function installPackages(packages: string[]): Promise<unknown>;
export declare function resetPyYouwolDbs$(): import("@youwol/http-primitives").HTTPResponse$<unknown>;
export declare function cleanDocument(): void;
