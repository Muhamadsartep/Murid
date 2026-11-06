import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// This file is web-only and used to configure the root HTML for every
// web page during static rendering in Expo Router.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ku">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/*
          Disable body scrolling on web so that React Native ScrollView
          components behave closer to native iOS/Android boundaries.
        */}
        <ScrollViewStyleReset />

        {/*
          Inject vector icon fonts directly via reliable CDN links so icons
          render immediately on web production (e.g. Netlify) without relying
          on runtime font loaders.
        */}
        <style
          id="expo-vector-icons"
          dangerouslySetInnerHTML={{
            __html: `
@font-face {
  font-family: 'ionicons';
  src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype'),
       url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Ionicons';
  src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype'),
       url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'feather';
  src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype'),
       url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Feather';
  src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype'),
       url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'FontAwesome';
  src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf') format('truetype'),
       url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'fontawesome';
  src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf') format('truetype'),
       url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'material';
  src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype'),
       url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'MaterialIcons';
  src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype'),
       url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

