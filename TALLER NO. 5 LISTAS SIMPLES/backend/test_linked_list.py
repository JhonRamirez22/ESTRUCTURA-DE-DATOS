"""Tests de la lista enlazada de tareas. Ejecutar con: python -m unittest -v"""

import unittest

from linked_list import TaskLinkedList


class TestTaskLinkedList(unittest.TestCase):
    def test_add_returns_ordered_ids(self) -> None:
        tasks = TaskLinkedList()
        a = tasks.add("comprar pan")
        b = tasks.add("pagar recibo")
        self.assertEqual([n.title for n in tasks], ["comprar pan", "pagar recibo"])
        self.assertEqual((a.id, b.id), (1, 2))
        self.assertEqual(len(tasks), 2)

    def test_add_rejects_empty_or_whitespace_title(self) -> None:
        tasks = TaskLinkedList()
        with self.assertRaises(ValueError):
            tasks.add("   ")

    def test_add_rejects_title_too_long(self) -> None:
        tasks = TaskLinkedList()
        with self.assertRaises(ValueError):
            tasks.add("x" * 201)

    def test_remove_on_empty_list_returns_false(self) -> None:
        tasks = TaskLinkedList()
        self.assertFalse(tasks.remove(1))

    def test_remove_nonexistent_id_returns_false(self) -> None:
        tasks = TaskLinkedList()
        tasks.add("a")
        self.assertFalse(tasks.remove(999))

    def test_remove_head(self) -> None:
        tasks = TaskLinkedList()
        first = tasks.add("a")
        tasks.add("b")
        self.assertTrue(tasks.remove(first.id))
        self.assertEqual([n.title for n in tasks], ["b"])
        self.assertIs(tasks.head, tasks.find(2))

    def test_remove_tail_updates_tail_pointer(self) -> None:
        tasks = TaskLinkedList()
        tasks.add("a")
        last = tasks.add("b")
        self.assertTrue(tasks.remove(last.id))
        self.assertEqual([n.title for n in tasks], ["a"])
        self.assertIs(tasks.tail, tasks.head)

    def test_remove_middle(self) -> None:
        tasks = TaskLinkedList()
        tasks.add("a")
        mid = tasks.add("b")
        tasks.add("c")
        self.assertTrue(tasks.remove(mid.id))
        self.assertEqual([n.title for n in tasks], ["a", "c"])

    def test_remove_only_node_resets_head_and_tail(self) -> None:
        tasks = TaskLinkedList()
        only = tasks.add("a")
        tasks.remove(only.id)
        self.assertIsNone(tasks.head)
        self.assertIsNone(tasks.tail)
        self.assertEqual(len(tasks), 0)

    def test_toggle_completed(self) -> None:
        tasks = TaskLinkedList()
        node = tasks.add("a")
        self.assertTrue(tasks.toggle_completed(node.id))
        self.assertTrue(node.completed)
        self.assertTrue(tasks.toggle_completed(node.id))
        self.assertFalse(node.completed)

    def test_toggle_completed_nonexistent_returns_false(self) -> None:
        tasks = TaskLinkedList()
        self.assertFalse(tasks.toggle_completed(42))

    def test_clear_completed_keeps_order_of_remaining(self) -> None:
        tasks = TaskLinkedList()
        a = tasks.add("a")
        tasks.add("b")
        c = tasks.add("c")
        tasks.toggle_completed(a.id)
        tasks.toggle_completed(c.id)
        removed = tasks.clear_completed()
        self.assertEqual(removed, 2)
        self.assertEqual([n.title for n in tasks], ["b"])

    def test_add_after_remove_reuses_tail_pointer_correctly(self) -> None:
        tasks = TaskLinkedList()
        a = tasks.add("a")
        tasks.remove(a.id)
        tasks.add("b")  # debe volver a fijar head/tail, no quedar en None por error
        self.assertEqual([n.title for n in tasks], ["b"])


if __name__ == "__main__":
    unittest.main()
