use async_graphql::{Schema, Object, EmptySubscription, EmptyMutation, Result as GraphQLResult, SimpleObject};

#[derive(SimpleObject, Debug, Clone)]
struct ListItem {
    id: i32,
    text: String
}

impl ListItem {
    pub fn new(text: String) -> Self {
        Self {
            id: rand::random::<i32>(),
            text
        }
    }
}

pub struct Query;

#[Object]
impl Query {
    async fn list(&self) -> GraphQLResult<Vec<ListItem>> {
        let item = vec![
            ListItem::new("foo".to_string()),
            ListItem::new("bar".to_string())
        ];

        Ok(item)
    }
}

pub fn init_plugin<R: tauri::Runtime>() -> mizuki::MizukiPlugin<R, Query, EmptyMutation, EmptySubscription> {
    mizuki::Builder::new("graphql-plugin", Schema::new(
        Query,
        EmptyMutation,
        EmptySubscription,
    )).build()
}