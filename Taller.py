list = [10, 25, 30, 45, 50]

list2 = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]
for row in list2:
    print(" ", row)

second_element = list[1]
print("\n2a - Second element of the 1D list:", second_element)

second_row_col = list2[1][1]
print("2b - Element at row 2, column 2 of the 2D list:", second_row_col)


list.insert(2, "Estructura de datos")
print("\n3a - 1D list after inserting 'Estructura de datos' at position 3:")
print("    ", list)


deleted_element = list2[2].pop(2)
print("\n3b - Deleted element (row 3, col 3):", deleted_element)
print("    2D list after deletion:")
for row in list2:
    print("     ", row)


search_index = list.index("Estructura de datos")
print("\n4a - Index of 'Estructura de datos' in the 1D list:", search_index)


search_value = 5
search_index_2d = list2[1].index(search_value)
print("4b - Index of", search_value, "in the second row of the 2D list:", search_index_2d)
