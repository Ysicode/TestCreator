import { Injectable } from "@angular/core";
import { collection, collectionData, deleteDoc, doc, Firestore, getDocs, onSnapshot, query, setDoc, updateDoc, where } from "@angular/fire/firestore";
import { getDoc } from "@firebase/firestore";
import { Observable } from "rxjs";


@Injectable({ providedIn: 'root' })

export class dataTransferService {
    loadedUserdata = [];
    loadedQuestions = [];
    subjectsAndClassesFromFirestore$: Observable<any>;
    questionsFromFirestore$: Observable<any>;
    testHeadFromFirestore$: Observable<any>;
    subUsersFromFirestore$: Observable<any>;
    subusers = [];
    currentTestHead: any;
    currentUserID: any;
    currentSchool: string = 'JonasWeiss';
    currentUserData$: Observable<any>;
    currentUserData: any;


    //Athentication
    currentPassword: string = '54321';
    currentEmailAdress: string = 'valentin@gmail.com';

    // loaded = false;
    public loaded: boolean = false;

    constructor(private firestore: Firestore) { }

    /**
      * this function is used to load all subject and classes from firebase
      * and store it in a local object (loadedUserData)
      */
    async loadSubjectsAndClasses() {
        //gets UserData like classes and subjects and email adress and username
        const subject: any = collection(this.firestore, 'users', this.currentSchool, 'subjects');
        this.subjectsAndClassesFromFirestore$ = collectionData(subject, { idField: 'id' });
        this.subjectsAndClassesFromFirestore$.subscribe((data) => {
            this.loadedUserdata = data;
        });
    }

    getName() {
        return this.loaded
    }


    //LOAD ALL QUESTIONS
    async loadQuestions() {
        //gets all questions
        const coll: any = collection(this.firestore, 'users', this.currentSchool, 'fragen');
        this.questionsFromFirestore$ = collectionData(coll, { idField: 'id' })
        this.questionsFromFirestore$.subscribe((data) => {
            this.loadedQuestions = data;
            this.loadedQuestions.sort((x, y) => {
                return y.frage.time - x.frage.time
            })
        });
    }



    // ADD SUBUSER
    async addNewSubUser(sub_user_password: string, sub_user_name: string) {
        const coll: any = collection(this.firestore, 'users', this.currentSchool, 'subusers');
        setDoc(doc(coll), {
            password: sub_user_password, //Variable - wird später geändert durch den Admin beim anlegen von neuen unterusern
            username: sub_user_name, //Variable - wird später geändert durch den Admin beim anlegen von neuen unterusern
        });
    }


    // UPDATE SUBUSER
    async updateSubUserData(password, username) {
        const docRef = doc(this.firestore, 'users', this.currentSchool, 'subusers', this.currentUserID); //ID und Schule müssen später variable sein
        updateDoc((docRef), {
            password: password, //Variable - wird später geändert durch den Admin beim anlegen von neuen unterusern
            username: username, //Variable - wird später geändert durch den Admin beim anlegen von neuen unterusern
        })

        onSnapshot(docRef, (doc: any) => { // Snapshot detect changes made to the doc. So wenn sie ändert in echtzeit
            this.currentUserData = doc.data();
            this.currentUserID = doc.id;
        });
    }


    //LOAD SUBUSERDATA
    async loadSubUserData() {
        const coll: any = collection(this.firestore, 'users', this.currentSchool, 'subusers');
        const q = query(coll, where("password", "==", this.currentPassword), where("email", "==", this.currentEmailAdress)); //Collection abfrage nach password und Username
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            console.log('BINGO', doc.id, " => ", doc.data());
            this.currentUserID = doc.id;
            this.currentUserData = doc.data();
        });

        const docRef = doc(this.firestore, 'users', this.currentSchool, 'subusers', this.currentUserID); //ID und Schule müssen später variable sein
        // const subUserData = await getDoc(docRef);
        // this.currentUserData = subUserData.data();
        // this.currentUserID = subUserData.id;


        onSnapshot(docRef, (doc: any) => { // Snapshot detect changes made to the doc. So wenn sie ändert in echtzeit
            this.currentUserData = doc.data();
            this.currentUserID = doc.id;
        });

        this.loaded = true;
    }




    //LOAD SCHOOL DATA
    async loadUSchoolData() {
        const docRef: any = doc(this.firestore, 'users', this.currentSchool); // muss variabel sein je nachdem welche Schule ausgewählt wird
        const schoolData = await getDoc(docRef);
        console.log("Document data:", schoolData.data());
    }


    /**
    * This function is used to delete a question form firebase
    * @param id is the firebase id of the question to delete it
    */
    deletedata(id: string) {
        const coll: any = doc(this.firestore, 'users', this.currentSchool, 'fragen' + id);
        deleteDoc(coll);
    }

    log(id: string) {
        console.log(id);
    }



    logID(id: string) {
        console.log(id)
    }






    // async loadTestHead() {
    //     console.log(this.currentUserID)
    //     const docRef: any = doc(this.firestore, 'users', 'JonasWeiss', 'subusers/' + this.currentUserID)
    //     const userData = await getDoc(docRef);
    //     this.currentUserData = userData.data();
    //     console.log(this.currentUserData);
    // }

    // /**
    //  * This function is used to load the current testHead from firebase
    //  * and store it in a local object (currenttestHead)
    //  */
    // async loadtestHead() {
    //     const testHead: any = collection(this.firestore, 'users', 'JonasWeiss', 'testHead');
    //     this.testHeadFromFirestore$ = collectionData(testHead);
    //     this.testHeadFromFirestore$.subscribe((data) => {
    //         this.currentTestHead = data;
    //     });
    // }

}