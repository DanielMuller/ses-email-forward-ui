export default {
  name: 'RestoreBlacklisted',
  methods: {
    deleteBlacklisted: function (dynamodb, items) {
      const deleteItems = []
      items.forEach(item => {
        const deleteItem = {
          DeleteRequest: {
            Key: {
              destination: {
                S: item.destination
              },
              createdAt: {
                N: item.createdAt.toString()
              }
            }
          }
        }
        deleteItems.push(deleteItem)
      })

      const params = {
        RequestItems: {}
      }
      params.RequestItems[this.tableBounces] = deleteItems
      dynamodb.batchWriteItem(params)
    }
  }
}
