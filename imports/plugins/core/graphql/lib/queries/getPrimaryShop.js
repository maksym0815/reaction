import gql from "graphql-tag";

export default gql`
  query getPrimaryShop($id: ID!) {
    shop(id: $id) {
      _id
      name
      storefrontUrls {
        storefrontHomeUrl
        storefrontOrderUrl
        storefrontOrdersUrl
        storefrontAccountProfileUrl
      }
    }
  }
`;
