import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, useAccount, useConnect, useSendTransaction, http } from 'wagmi';
import { CivicAuthProvider, embeddedWallet, NewWeb3User, useUser, Web3User } from '@civic/auth-web3';
import { mainnet, sepolia } from "wagmi/chains";

const userHasWallet = (user: any) => (user.user as Web3User).walletAddress;

const wagmiConfig = createConfig({
  chains: [ mainnet, sepolia ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    embeddedWallet(),
  ],
});

// Wagmi requires react-query
const queryClient = new QueryClient();

const App = () => {
  // the civic user hook
  const user = useUser();

  // add the wagmi hooks
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const { sendTransaction } = useSendTransaction();

  // A function that creates the wallet if the user doesn't have one already
  const createWallet = () => {
    if (user && !userHasWallet(user)) {
      // once the wallet is created, we can connect it straight away
      if((user.user as NewWeb3User).createWallet) {
        return (user.user as NewWeb3User).createWallet!().then(connectExistingWallet);
      };
    }
  }

  const connectExistingWallet = () => connect({
    connector: connectors[0]
  })

  const sendTx = () => sendTransaction({
    to: '0x...',
    value: 1000n,
  })

  return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <CivicAuthProvider>
            { user && !userHasWallet(user) &&
                <button onClick={createWallet}>Create Wallet</button>
            }
            {!isConnected ? (
                <button onClick={connectExistingWallet}>Connect Wallet</button>
            ) : (
                <button onClick={sendTx}>Send Transaction</button>
            )}
          </CivicAuthProvider>
        </WagmiProvider>
      </QueryClientProvider>
  );
};

export default App;
