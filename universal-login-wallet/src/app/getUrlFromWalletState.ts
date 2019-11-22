export const getUrlFromWalletState = (walletState: any, pathName: string) => {
  switch(walletState) {
    case 'Future':
      return '/create';
    case 'Deployed':
      return '/';
    case undefined:
      return '/welcome';
    default:
      return pathName;
  }
}