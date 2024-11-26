import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, useAccount, useConnect, useSendTransaction, http } from 'wagmi';
import { embeddedWallet, userHasWallet } from '@civic/auth-web3';
import { CivicAuthProvider, UserButton, useUser } from '@civic/auth-web3/react';
import { mainnet, sepolia } from "wagmi/chains";

const CLIENT_ID = process.env.CLIENT_ID;
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

// Separate component for the app content that needs access to hooks
const AppContent = () => {
  const userContext = useUser();
  const { isLoading, isAuthenticated } = userContext;

  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const { sendTransaction } = useSendTransaction();

  const createWallet = () => {
    if (userContext && !userHasWallet(userContext)) {
      // once the wallet is created, we can connect it straight away
      return userContext.createWallet().then(connectExistingWallet);
    }
  };

  const connectExistingWallet = () => { 
    return connect({
      connector: connectors[0]
    });
  };

  const sendTx = () => sendTransaction({
    to: '0x...',
    value: 1000n,
  });

  return (
    <>
      <UserButton displayMode={"new_tab"} />
      {isLoading &&
        <p>Loading...</p>
      }
      {!isLoading && userHasWallet(userContext) &&
        <p>
          Wallet address: {userContext.walletAddress}
          {!isConnected && <div><button onClick={connectExistingWallet}>Connect Wallet</button></div>}
          {isConnected && <div><button onClick={sendTx}>Send Transaction</button></div>}
        </p>
      }
      {!isLoading && !userHasWallet(userContext) && isAuthenticated &&
        <p><button onClick={createWallet}>Create Wallet</button></p>
      }
    </>
  );
};

// Main App component that sets up providers
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider clientId={CLIENT_ID}>
          <AppContent />
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export default App;