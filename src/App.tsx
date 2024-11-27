import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WagmiProvider,
  createConfig,
  useAccount,
  useConnect,
  useSendTransaction,
  http,
  Connector,
} from 'wagmi';
import { embeddedWallet, userHasWallet } from '@civic/auth-web3';
import { CivicAuthProvider, UserButton, useUser } from '@civic/auth-web3/react';
import { mainnet, sepolia } from "wagmi/chains";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
if (!CLIENT_ID) throw new Error('CLIENT_ID is required');

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

// Wrap the content with the necessary providers to give access to hooks: react-query, wagmi & civic auth provider
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider clientId={CLIENT_ID} >
          <AppContent />
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

// Separate component for the app content that needs access to hooks
const AppContent = () => {
  const userContext = useUser();

  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const { sendTransaction } = useSendTransaction();

  // A function to connect an existing civic embedded wallet
  const connectExistingWallet = () => { 
    return connect({
      connector: connectors.find(c => c.type === "civic") as Connector,
    });
  };

  // A function that creates the wallet if the user doesn't have one already
  const createWallet = () => {
    if (userContext.user && !userHasWallet(userContext)) {
      // Once the wallet is created, we can connect it straight away
      return userContext.createWallet().then(connectExistingWallet);
    }
  };

  // A reference implementation of a function to send a transaction
  const sendTx = () => sendTransaction({
    to: '0x...',
    value: 1000n,
  });

  return (
    <>
      <UserButton />
      {userContext.user &&
        <p>
          {!userHasWallet(userContext) &&
            <button onClick={createWallet}>Create Wallet</button>
          }
          {userHasWallet(userContext) &&
            <>
              Wallet address: {userContext.walletAddress}
              {isConnected ? (
                  <button onClick={sendTx}>Send Transaction</button>
                ) : (
                  <button onClick={connectExistingWallet}>Connect Wallet</button>
              )}
            </>
          }
        </p>
      }
    </>
  );
};

export default App;
