declare module 'web3-core' {
  export interface AbstractProvider {
    sendAsync(payload: any, callback: (err: any, result: any) => void): void;
    send?(payload: any, callback: (err: any, result: any) => void): void;
  }

  export interface HttpProvider extends AbstractProvider {}
  export interface IpcProvider extends AbstractProvider {}
  export interface WebsocketProvider extends AbstractProvider {}

  export interface Account {
    address: string;
    privateKey: string;
  }
}
